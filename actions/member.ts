'use server';

import crypto from 'crypto';
import { z } from 'zod';
import { Resend } from 'resend';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import db from '@/lib/db';
import { inviteSchema } from '@/lib/validations';
import { BoardRole } from '@prisma/client';

const resend = new Resend(process.env.RESEND_API_KEY);
const baseUrl = process.env.NEXTAUTH_URL ?? 'https://kanvi.app';

function emailFooter() {
  return `<p style="font-size:11px;color:#d4d4d8;margin:20px 0 0;border-top:1px solid #f4f4f5;padding-top:16px">
    You received this because you were invited to a Kanvi board.
  </p>`;
}

function primaryButton(href: string, label: string) {
  return `<a href="${href}"
     style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600">
    ${label}
  </a>`;
}

async function checkBoardOwnership(boardId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const board = await db.board.findUnique({
    where: { id: boardId },
  });

  if (!board || board.userId !== session.user.id) {
    throw new Error('Unauthorized: Only board owners can manage members.');
  }

  return { session, board };
}

export async function inviteMember(
  boardId: string,
  values: z.input<typeof inviteSchema>
) {
  const { session, board } = await checkBoardOwnership(boardId);

  const validatedFields = inviteSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: 'Invalid fields.' };
  }

  const { email: rawEmail, role } = validatedFields.data;
  const email = rawEmail.trim().toLowerCase();

  if (email === session.user.email?.toLowerCase()) {
    return { error: 'You cannot invite yourself.' };
  }

  const inviterName = session.user.name ?? session.user.email ?? 'Someone';

  try {
    const existingUser = await db.user.findUnique({ where: { email } });

    if (existingUser) {
      const existingMember = await db.boardMember.findUnique({
        where: { userId_boardId: { userId: existingUser.id, boardId } },
      });
      if (existingMember) {
        return { error: 'This person is already a member of this board.' };
      }

      await db.boardMember.create({
        data: { boardId, userId: existingUser.id, role },
      });

      // Notify the existing user they've been added
      resend.emails.send({
        from: 'Kanvi <hello@kanvi.app>',
        to: email,
        subject: `You've been added to ${board.title}`,
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#09090b">
            <p style="font-size:20px;font-weight:700;margin:0 0 8px">You&rsquo;re on the board!</p>
            <p style="font-size:14px;color:#71717a;margin:0 0 24px">
              <strong style="color:#09090b">${inviterName}</strong> added you to
              <strong style="color:#09090b">${board.title}</strong> on Kanvi.
            </p>
            ${primaryButton(`${baseUrl}/boards/${boardId}`, 'Open board')}
            ${emailFooter()}
          </div>
        `,
      }).catch(() => {});

      revalidatePath(`/boards/${boardId}`);
      return { success: 'Invite sent.' };
    }

    // User doesn't have an account — create or refresh a pending invite
    const token = crypto.randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.boardInvite.upsert({
      where: { boardId_email: { boardId, email } },
      update: { token, status: 'PENDING', expiresAt, role, invitedById: session.user.id },
      create: { boardId, email, token, role, status: 'PENDING', expiresAt, invitedById: session.user.id },
    });

    // Send the invite email
    resend.emails.send({
      from: 'Kanvi <hello@kanvi.app>',
      to: email,
      subject: `You've been invited to collaborate on ${board.title}`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#09090b">
          <p style="font-size:20px;font-weight:700;margin:0 0 8px">You&rsquo;ve been invited!</p>
          <p style="font-size:14px;color:#71717a;margin:0 0 24px">
            <strong style="color:#09090b">${inviterName}</strong> invited you to collaborate on
            <strong style="color:#09090b">${board.title}</strong>.
            Join for free — no credit card required.
          </p>
          ${primaryButton(`${baseUrl}/invite/${token}`, 'Join board')}
          <p style="font-size:12px;color:#a1a1aa;margin:24px 0 0">
            This invite expires in 7 days.
          </p>
          ${emailFooter()}
        </div>
      `,
    }).catch(() => {});

    revalidatePath(`/boards/${boardId}`);
    return { success: 'Invite sent.' };
  } catch {
    return { error: 'Failed to send invite.' };
  }
}

export async function removeMember(boardId: string, userId: string) {
  const { session } = await checkBoardOwnership(boardId);

  if (session.user.id === userId) {
    return { error: "You cannot remove yourself as the owner." };
  }

  try {
    await db.boardMember.delete({
      where: {
        userId_boardId: {
          userId,
          boardId,
        },
      },
    });

    revalidatePath(`/boards/${boardId}`);
    return { success: 'Member removed.' };
  } catch (error) {
    return { error: 'Failed to remove member.' };
  }
}

export async function getPendingInvites(boardId: string) {
  await checkBoardOwnership(boardId);

  return db.boardInvite.findMany({
    where: { boardId, status: 'PENDING' },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      expiresAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function revokeInvite(inviteId: string, boardId: string) {
  await checkBoardOwnership(boardId);

  const invite = await db.boardInvite.findFirst({
    where: { id: inviteId, boardId, status: 'PENDING' },
  });
  if (!invite) return { error: 'Invite not found.' };

  try {
    await db.boardInvite.update({
      where: { id: inviteId },
      data: { status: 'REVOKED' },
    });
    return { success: 'Invite revoked.' };
  } catch {
    return { error: 'Failed to revoke invite.' };
  }
}

export async function resendInvite(inviteId: string, boardId: string) {
  const { session, board } = await checkBoardOwnership(boardId);

  const invite = await db.boardInvite.findFirst({
    where: { id: inviteId, boardId, status: 'PENDING' },
  });
  if (!invite) return { error: 'Invite not found.' };

  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const inviterName = session.user.name ?? session.user.email ?? 'Someone';

  try {
    await db.boardInvite.update({
      where: { id: inviteId },
      data: { token, expiresAt },
    });

    resend.emails.send({
      from: 'Kanvi <hello@kanvi.app>',
      to: invite.email,
      subject: `You've been invited to collaborate on ${board.title}`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#09090b">
          <p style="font-size:20px;font-weight:700;margin:0 0 8px">You&rsquo;ve been invited!</p>
          <p style="font-size:14px;color:#71717a;margin:0 0 24px">
            <strong style="color:#09090b">${inviterName}</strong> invited you to collaborate on
            <strong style="color:#09090b">${board.title}</strong>.
            Join for free — no credit card required.
          </p>
          ${primaryButton(`${baseUrl}/invite/${token}`, 'Join board')}
          <p style="font-size:12px;color:#a1a1aa;margin:24px 0 0">
            This invite expires in 7 days.
          </p>
          ${emailFooter()}
        </div>
      `,
    }).catch(() => {});

    return { success: 'Invite resent.' };
  } catch {
    return { error: 'Failed to resend invite.' };
  }
}

export async function updateMemberRole(
  boardId: string,
  userId: string,
  role: BoardRole
) {
  const { session } = await checkBoardOwnership(boardId);

  if (session.user.id === userId) {
    return { error: "You cannot change your own role." };
  }

  try {
    await db.boardMember.update({
      where: {
        userId_boardId: {
          userId,
          boardId,
        },
      },
      data: { role },
    });

    revalidatePath(`/boards/${boardId}`);
    return { success: "Member's role updated." };
  } catch (error) {
    return { error: "Failed to update member's role." };
  }
}