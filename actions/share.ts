'use server';

import { revalidatePath } from 'next/cache';
import db from '@/lib/db';

export async function acknowledgeClientTask(taskId: string, shareToken: string) {
  if (!taskId || !shareToken) return { error: 'Invalid request.' };

  const board = await db.board.findUnique({
    where: { shareToken },
    select: { id: true, userId: true },
  });
  if (!board) return { error: 'Invalid share link.' };

  const task = await db.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      needsClient: true,
      clientReviewedAt: true,
      column: { select: { boardId: true } },
    },
  });
  if (!task) return { error: 'Task not found.' };
  if (task.column.boardId !== board.id) return { error: 'Unauthorized.' };
  if (!task.needsClient) return { error: 'Task is not awaiting review.' };

  // Idempotent — return existing timestamp if already reviewed
  if (task.clientReviewedAt) {
    return { success: 'Already reviewed.', reviewedAt: task.clientReviewedAt };
  }

  const now = new Date();
  await db.task.update({ where: { id: taskId }, data: { clientReviewedAt: now } });

  await db.activityLog.create({
    data: {
      action: 'Client reviewed this task.',
      userId: board.userId,
      taskId,
      boardId: board.id,
    },
  });

  revalidatePath(`/share/${shareToken}`);
  return { success: 'Reviewed.', reviewedAt: now };
}
