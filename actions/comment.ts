'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import db from '@/lib/db';
import { commentSchema } from '@/lib/validations';

async function checkTaskPermissions(taskId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const task = await db.task.findUnique({
    where: { id: taskId },
    include: { column: { include: { board: { include: { members: true } } } } },
  });

  if (!task) {
    throw new Error('Task not found');
  }

  const board = task.column.board;
  const isOwner = board.userId === session.user.id;
  const member = board.members.find((m) => m.userId === session.user.id);

  if (!isOwner && !member) {
    throw new Error('Unauthorized');
  }
  if (!isOwner && member?.role === 'VIEWER') {
    throw new Error('Viewers cannot add comments');
  }

  return { session, task, board };
}

export async function createComment(
  taskId: string,
  values: z.infer<typeof commentSchema>
) {
  const { session, board } = await checkTaskPermissions(taskId);

  const validatedFields = commentSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: 'Invalid comment.' };
  }

  const { content } = validatedFields.data;

  try {
    await db.comment.create({
      data: {
        content,
        taskId,
        userId: session.user.id,
      },
    });

    revalidatePath(`/boards/${board.id}`);
    return { success: 'Comment added.' };
  } catch (error) {
    return { error: 'Failed to add comment.' };
  }
}

export async function deleteComment(commentId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  const comment = await db.comment.findUnique({
    where: { id: commentId },
    include: { task: { include: { column: { select: { boardId: true } } } } },
  });

  if (!comment) {
    return { error: 'Comment not found.' };
  }

  if (comment.userId !== session.user.id) {
    return { error: 'Unauthorized to delete this comment.' };
  }

  try {
    await db.comment.delete({
      where: { id: commentId },
    });

    const boardId = comment.task.column.boardId;
    revalidatePath(`/boards/${boardId}`);
    return { success: 'Comment deleted.' };
  } catch (error) {
    return { error: 'Failed to delete comment.' };
  }
}