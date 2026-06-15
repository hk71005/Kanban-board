import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import db from '@/lib/db';
import Board from '@/components/board/Board';

interface BoardPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: BoardPageProps) {
  const { id } = await params;

  const board = await db.board.findUnique({
    where: { id },
    select: { title: true },
  });

  return {
    title: `${board?.title || 'Board'} | Kanban Board`,
  };
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return notFound();
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
              comments: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
                orderBy: {
                  createdAt: 'desc',
                },
              },
            },
          },
        },
      },
    },
  });

  if (!board) {
    notFound();
  }

  return <Board initialBoardData={board} currentUserId={session.user.id} />;
}