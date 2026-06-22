import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import db from '@/lib/db';
import Board from '@/components/board/Board';
import type { BoardWithDetails } from '@/types';

interface BoardPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ task?: string }>;
}

export async function generateMetadata({ params }: BoardPageProps) {
  const { id } = await params;

  const board = await db.board.findUnique({
    where: { id },
    select: { title: true },
  });

  return {
    title: `${board?.title || 'Board'} | Kanvi`,
  };
}

export default async function BoardPage({ params, searchParams }: BoardPageProps) {
  const { id } = await params;
  const { task: initialTaskId } = await searchParams;
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
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
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      columns: {
        orderBy: {
          order: 'asc',
        },
        include: {
          tasks: {
            orderBy: {
              order: 'asc',
            },
            include: {
              column: true,
              labels: true,
              subtasks: true,
            },
          },
        },
      },
    },
  });

  if (!board) {
    notFound();
  }

  const boardWithDetails: BoardWithDetails = {
    ...board,
    columns: board.columns.map((col) => ({
      ...col,
      tasks: col.tasks.map((task) => ({ ...task, comments: [] })),
    })),
  };

  return <Board initialBoardData={boardWithDetails} currentUserId={session.user.id} initialTaskId={initialTaskId} />;
}