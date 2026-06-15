'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import db from '@/lib/db';
import { memberSchema } from '@/lib/validations';
import { BoardRole } from '@prisma/client';

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
  values: z.infer<typeof memberSchema>
) {
  await checkBoardOwnership(boardId);

  const validatedFields = memberSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: 'Invalid email.' };
  }

  const { email } = validatedFields.data;

  try {
    const userToInvite = await db.user.findUnique({ where: { email } });
    if (!userToInvite) {
      return { error: 'User with this email does not exist.' };
    }

    const existingMember = await db.boardMember.findFirst({
      where: { boardId, userId: userToInvite.id },
    });

    if (existingMember) {
      return { error: 'User is already a member of this board.' };
    }

    await db.boardMember.create({
      data: {
        boardId,
        userId: userToInvite.id,
        role: 'EDITOR',
      },
    });

    revalidatePath(`/boards/${boardId}`);
    return { success: `${userToInvite.name || userToInvite.email} has been invited.` };
  } catch (error) {
    return { error: 'Failed to invite member.' };
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