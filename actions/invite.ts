'use server';

import db from '@/lib/db';
import { auth } from '@/lib/auth';

export async function getInvite(token: string) {
  const invite = await db.boardInvite.findUnique({
    where: { token },
    select: {
      email: true,
      status: true,
      expiresAt: true,
      boardId: true,
      board: { select: { title: true } },
      invitedBy: { select: { name: true } },
    },
  });

  if (!invite) return { error: 'invalid' as const };
  if (invite.status !== 'PENDING') return { error: 'invalid' as const };
  if (invite.expiresAt < new Date()) return { error: 'expired' as const };

  return {
    email: invite.email,
    boardId: invite.boardId,
    boardTitle: invite.board.title,
    inviterName: invite.invitedBy.name ?? 'Someone on Kanvi',
  };
}

export async function acceptInvite(token: string) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return { error: 'unauthenticated' as const };
  }

  const invite = await db.boardInvite.findUnique({
    where: { token },
    select: {
      id: true,
      email: true,
      boardId: true,
      role: true,
      status: true,
      expiresAt: true,
    },
  });

  if (!invite || invite.status !== 'PENDING' || invite.expiresAt < new Date()) {
    return { error: 'invalid' as const };
  }

  if (invite.email.toLowerCase() !== session.user.email.toLowerCase()) {
    return { error: 'mismatch' as const, inviteEmail: invite.email };
  }

  // Upsert is atomic — concurrent acceptance attempts cannot produce duplicate rows.
  await db.boardMember.upsert({
    where: { userId_boardId: { userId: session.user.id, boardId: invite.boardId } },
    create: { boardId: invite.boardId, userId: session.user.id, role: invite.role },
    update: {},
  });

  await db.boardInvite.update({
    where: { id: invite.id },
    data: { status: 'ACCEPTED', acceptedAt: new Date() },
  });

  return { boardId: invite.boardId };
}
