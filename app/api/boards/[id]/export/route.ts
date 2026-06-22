import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import db from '@/lib/db';

function csvCell(value: string | null | undefined): string {
  const str = value ?? '';
  return `"${str.replace(/"/g, '""')}"`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const board = await db.board.findUnique({
    where: {
      id,
      OR: [
        { userId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      columns: {
        orderBy: { order: 'asc' },
        include: {
          tasks: {
            orderBy: { order: 'asc' },
            include: {
              labels: true,
              subtasks: { orderBy: { order: 'asc' } },
            },
          },
        },
      },
    },
  });

  if (!board) {
    return new Response('Not Found', { status: 404 });
  }

  const memberMap = new Map<string, string>();
  for (const m of board.members) {
    memberMap.set(m.user.id, m.user.name || m.user.email);
  }

  const header = [
    'Board Name',
    'Task Title',
    'Description',
    'Status',
    'Priority',
    'Labels',
    'Due Date',
    'Assignee',
    'Waiting on Client',
    'Subtasks',
  ];

  const rows: string[][] = [header];

  for (const column of board.columns) {
    for (const task of column.tasks) {
      const labels = task.labels.map((l) => l.name).join('; ');
      const dueDate = task.dueDate ? task.dueDate.toISOString().split('T')[0] : '';
      const assignee = task.assignee ? (memberMap.get(task.assignee) ?? '') : '';
      const subtasks = task.subtasks
        .map((s) => (s.completed ? `[x] ${s.title}` : `[ ] ${s.title}`))
        .join('; ');

      rows.push([
        board.title,
        task.title,
        task.description ?? '',
        column.title,
        task.priority,
        labels,
        dueDate,
        assignee,
        task.needsClient ? 'Yes' : 'No',
        subtasks,
      ]);
    }
  }

  const csv = rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
  const filename = `${board.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.csv`;

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
