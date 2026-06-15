'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import db from '@/lib/db';
import { boardSchema, columnSchema } from '@/lib/validations';

async function checkBoardOwnership(boardId: string, requireEdit = false) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const board = await db.board.findUnique({
    where: { id: boardId },
    include: { members: true },
  });

  if (!board) {
    throw new Error('Board not found');
  }

  // Board owner always has full access.
  if (board.userId === session.user.id) {
    return { session, board };
  }

  const member = board.members.find((m) => m.userId === session.user.id);
  if (!member) {
    throw new Error('Unauthorized');
  }

  if (requireEdit && member.role === 'VIEWER') {
    throw new Error('Viewers cannot make changes to this board');
  }

  return { session, board };
}

export async function createBoard(values: z.infer<typeof boardSchema>) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  const validatedFields = boardSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: 'Invalid fields' };
  }

  const { title, emoji } = validatedFields.data;

  try {
    const newBoard = await db.board.create({
      data: {
        title,
        emoji,
        userId: session.user.id,
        members: {
          create: [{ userId: session.user.id, role: 'OWNER' }],
        },
        columns: {
          create: [
            { title: 'To Do', order: 0, color: '#7c3aed' },
            { title: 'In Progress', order: 1, color: '#3b82f6' },
            { title: 'Done', order: 2, color: '#22c55e' },
          ],
        },
      },
    });
    revalidatePath('/boards');
    return { success: 'Board created!', boardId: newBoard.id };
  } catch (error) {
    return { error: 'Failed to create board' };
  }
}

export async function deleteBoard(boardId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  const board = await db.board.findUnique({ where: { id: boardId } });
  if (!board || board.userId !== session.user.id) {
    return { error: 'Unauthorized' };
  }

  try {
    await db.board.delete({ where: { id: boardId } });
    revalidatePath('/boards');
    return { success: 'Board deleted!' };
  } catch (error) {
    return { error: 'Failed to delete board' };
  }
}

export async function updateBoard(boardId: string, values: { title: string; emoji?: string }) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Not authenticated' };

  const board = await db.board.findUnique({ where: { id: boardId } });
  if (!board || board.userId !== session.user.id) return { error: 'Unauthorized' };

  const title = values.title.trim();
  if (!title) return { error: 'Title is required' };

  try {
    await db.board.update({
      where: { id: boardId },
      data: { title, emoji: values.emoji ?? board.emoji },
    });
    revalidatePath(`/boards/${boardId}`);
    revalidatePath('/boards');
    return { success: title };
  } catch {
    return { error: 'Failed to update board' };
  }
}

export async function updateColumnOrder(
  boardId: string,
  updates: { id: string; order: number }[]
) {
  await checkBoardOwnership(boardId, true);
  try {
    await db.$transaction(
      updates.map((u) =>
        db.column.update({ where: { id: u.id }, data: { order: u.order } })
      )
    );
    revalidatePath(`/boards/${boardId}`);
    return { success: 'Column order updated' };
  } catch {
    return { error: 'Failed to update column order' };
  }
}

export async function createColumn(boardId: string, values: z.infer<typeof columnSchema>) {
  await checkBoardOwnership(boardId, true);

  const validatedFields = columnSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: 'Invalid fields' };
  }

  const { title, color } = validatedFields.data;

  try {
    const maxOrder = await db.column.aggregate({
      where: { boardId },
      _max: { order: true },
    });

    await db.column.create({
      data: {
        title,
        color,
        boardId,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });

    revalidatePath(`/boards/${boardId}`);
    return { success: 'Column created!' };
  } catch (error) {
    return { error: 'Failed to create column' };
  }
}

export async function updateColumn(columnId: string, title: string) {
  const column = await db.column.findUnique({ where: { id: columnId } });
  if (!column) return { error: 'Column not found' };
  await checkBoardOwnership(column.boardId, true);

  const trimmed = title.trim();
  if (!trimmed) return { error: 'Title cannot be empty' };

  try {
    await db.column.update({ where: { id: columnId }, data: { title: trimmed } });
    revalidatePath(`/boards/${column.boardId}`);
    return { success: trimmed };
  } catch {
    return { error: 'Failed to rename column' };
  }
}

export async function deleteColumn(columnId: string) {
    const column = await db.column.findUnique({ where: { id: columnId } });
    if (!column) {
        return { error: 'Column not found' };
    }
    await checkBoardOwnership(column.boardId, true);

    try {
        await db.column.delete({ where: { id: columnId } });
        revalidatePath(`/boards/${column.boardId}`);
        return { success: 'Column deleted!' };
    } catch (error) {
        return { error: 'Failed to delete column' };
    }
}