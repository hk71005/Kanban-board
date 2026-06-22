import crypto from 'crypto';
import { Priority } from '@prisma/client';
import db from './db';

type SeedTask = {
  title: string;
  priority: Priority;
  description?: string;
  subtasks?: string[];
};

const DEFAULT_COLS: { title: string; color: string; tasks: SeedTask[] }[] = [
  {
    title: 'To Do',
    color: '#60a5fa',
    tasks: [
      {
        title: 'Define project scope',
        priority: 'HIGH',
        description: 'Gather requirements from your client before work begins.',
        subtasks: ['List deliverables', 'Schedule kickoff call'],
      },
      {
        title: 'Share this board with your client',
        priority: 'MEDIUM',
        description:
          'Click Share in the top right — your client gets a read-only link, no account needed.',
      },
    ],
  },
  {
    title: 'In Progress',
    color: '#f59e0b',
    tasks: [
      {
        title: 'Deliver first milestone',
        priority: 'HIGH',
        description:
          'Move tasks here when work is underway. Drag cards between columns to update progress.',
      },
    ],
  },
  {
    title: 'Waiting on Client',
    color: '#a78bfa',
    tasks: [],
  },
  {
    title: 'Done',
    color: '#22c55e',
    tasks: [],
  },
];

export async function seedDemoBoard(userId: string): Promise<string> {
  const board = await db.board.create({
    data: {
      title: 'Website Redesign',
      emoji: 'Globe',
      userId,
      shareToken: crypto.randomBytes(32).toString('hex'),
      members: {
        create: [{ userId, role: 'OWNER' }],
      },
    },
  });

  await db.$transaction(async (tx) => {
    for (let i = 0; i < DEFAULT_COLS.length; i++) {
      const col = DEFAULT_COLS[i];
      const column = await tx.column.create({
        data: { title: col.title, color: col.color, order: i, boardId: board.id },
      });
      for (let j = 0; j < col.tasks.length; j++) {
        const taskDef = col.tasks[j];
        const task = await tx.task.create({
          data: {
            title: taskDef.title,
            description: taskDef.description,
            priority: taskDef.priority,
            order: j,
            columnId: column.id,
          },
        });
        if (taskDef.subtasks?.length) {
          for (let k = 0; k < taskDef.subtasks.length; k++) {
            await tx.subtask.create({
              data: { title: taskDef.subtasks[k], order: k, taskId: task.id },
            });
          }
        }
      }
    }
  });

  return board.id;
}
