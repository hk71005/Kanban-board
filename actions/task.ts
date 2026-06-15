'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import db from '@/lib/db';
import { taskSchema, subtaskSchema, commentSchema } from '@/lib/validations';
import { Prisma } from '@prisma/client';

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
  const isOwnerOrMember =
    board.userId === session.user.id ||
    board.members.some((m) => m.userId === session.user.id);

  if (!isOwnerOrMember) {
    throw new Error('Unauthorized');
  }

  return { session, task, board };
}

export async function createTask(
  columnId: string,
  values: z.infer<typeof taskSchema>
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  const column = await db.column.findUnique({
    where: { id: columnId },
    include: { board: true },
  });
  if (!column) {
    return { error: 'Column not found' };
  }

  // Ownership / role check before creating
  if (column.board.userId !== session.user.id) {
    const member = await db.boardMember.findUnique({
      where: { userId_boardId: { userId: session.user.id, boardId: column.boardId } },
    });
    if (!member) {
      return { error: 'Unauthorized' };
    }
    if (member.role === 'VIEWER') {
      return { error: 'Viewers cannot create tasks' };
    }
  }

  const validatedFields = taskSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: 'Invalid fields' };
  }

  const { title, description, priority, dueDate, assignee, storyPoints } = validatedFields.data;

  try {
    const maxOrder = await db.task.aggregate({
      where: { columnId },
      _max: { order: true },
    });

    await db.task.create({
      data: {
        title,
        description,
        priority,
        dueDate,
        assignee,
        storyPoints,
        columnId,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });

    revalidatePath(`/boards/${column.boardId}`);
    return { success: 'Task created!' };
  } catch (error) {
    return { error: 'Failed to create task' };
  }
}

export async function updateTask(
  taskId: string,
  values: z.infer<typeof taskSchema>
) {
  const { session, board } = await checkTaskPermissions(taskId);

  const validatedFields = taskSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: 'Invalid fields' };
  }

  const { labels, subtasks, ...taskData } = validatedFields.data;

  try {
    await db.$transaction(async (tx) => {
      await tx.task.update({
        where: { id: taskId },
        data: taskData,
      });

      // Handle labels
      if (labels) {
        await tx.label.deleteMany({ where: { taskId } });
        if (labels.length > 0) {
          await tx.label.createMany({
            data: labels.map((label) => ({ ...label, taskId })),
          });
        }
      }

      // Handle subtasks
      if (subtasks) {
        await tx.subtask.deleteMany({ where: { taskId } });
        if (subtasks.length > 0) {
          await tx.subtask.createMany({
            data: subtasks.map((subtask, index) => ({
              title: subtask.title,
              order: index,
              taskId,
            })),
          });
        }
      }
      
      await tx.activityLog.create({
        data: {
          action: `updated task "${taskData.title}"`,
          userId: session.user.id,
          taskId: taskId,
          boardId: board.id,
        }
      });
    });

    revalidatePath(`/boards/${board.id}`);
    return { success: 'Task updated!' };
  } catch (error) {
    return { error: 'Failed to update task' };
  }
}

export async function deleteTask(taskId: string) {
  const { board } = await checkTaskPermissions(taskId);

  try {
    await db.task.delete({ where: { id: taskId } });
    revalidatePath(`/boards/${board.id}`);
    return { success: 'Task deleted!' };
  } catch (error) {
    return { error: 'Failed to delete task' };
  }
}

export async function updateTaskOrder(
  boardId: string,
  updates: { id: string; order: number; columnId: string }[]
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  const board = await db.board.findUnique({
    where: { id: boardId },
    include: { members: { select: { userId: true } } },
  });
  if (!board) return { error: 'Board not found' };
  const isAuthorized =
    board.userId === session.user.id ||
    board.members.some((m) => m.userId === session.user.id);
  if (!isAuthorized) return { error: 'Unauthorized' };

  try {
    await db.$transaction(
      updates.map((u) =>
        db.task.update({
          where: { id: u.id },
          data: { order: u.order, columnId: u.columnId },
        })
      )
    );
    revalidatePath(`/boards/${boardId}`);
    return { success: 'Task order updated' };
  } catch (error) {
    return { error: 'Failed to update task order' };
  }
}

export async function updateSubtask(
  subtaskId: string,
  values: z.infer<typeof subtaskSchema>
) {
  const subtask = await db.subtask.findUnique({
    where: { id: subtaskId },
    include: { task: true },
  });
  if (!subtask) {
    return { error: 'Subtask not found' };
  }
  const { board } = await checkTaskPermissions(subtask.taskId);

  const validatedFields = subtaskSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: 'Invalid fields' };
  }

  try {
    await db.subtask.update({
      where: { id: subtaskId },
      data: validatedFields.data,
    });
    revalidatePath(`/boards/${board.id}`);
    return { success: 'Subtask updated!' };
  } catch (error) {
    return { error: 'Failed to update subtask' };
  }
}
export async function createSubtask(taskId: string, title: string) {
  const { board } = await checkTaskPermissions(taskId);

  if (!title.trim()) return { error: 'Title is required' };

  try {
    const maxOrder = await db.subtask.aggregate({
      where: { taskId },
      _max: { order: true },
    });

    await db.subtask.create({
      data: {
        title: title.trim(),
        taskId,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });

    revalidatePath(`/boards/${board.id}`);
    return { success: 'Subtask created!' };
  } catch (error) {
    return { error: 'Failed to create subtask' };
  }
}

export async function deleteSubtask(subtaskId: string) {
  const subtask = await db.subtask.findUnique({
    where: { id: subtaskId },
    include: { task: true },
  });
  if (!subtask) return { error: 'Subtask not found' };

  const { board } = await checkTaskPermissions(subtask.taskId);

  try {
    await db.subtask.delete({ where: { id: subtaskId } });
    revalidatePath(`/boards/${board.id}`);
    return { success: 'Subtask deleted!' };
  } catch (error) {
    return { error: 'Failed to delete subtask' };
  }
}