import { auth } from '@/lib/auth';
import db from '@/lib/db';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Columns3, Users } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';
import CreateBoardDialog from '@/components/board/CreateBoardDialog';

export default async function BoardsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const boards = await db.board.findMany({
    where: {
      OR: [
        { userId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
    orderBy: {
      createdAt: 'asc',
    },
    include: {
      _count: {
        select: { columns: true, members: true },
      },
    },
  });

  if (boards.length === 0) {
    return (
      <EmptyState
        title="No Boards Yet"
        description="Get started by creating your first Kanban board."
        action={<CreateBoardDialog />}
      />
    );
  }

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Your Boards ✨</h1>
        <CreateBoardDialog />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {boards.map((board) => (
          <Link href={`/boards/${board.id}`} key={board.id}>
            <Card className="transition-all duration-200 ease-in-out hover:border-primary hover:shadow-lg hover:shadow-primary/20 h-full flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <span className="mr-3 text-2xl">{board.emoji || '📋'}</span>
                  <span className="truncate">{board.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1" />
              <CardFooter className="flex items-center gap-4 text-xs text-muted-foreground border-t pt-3">
                <span className="flex items-center gap-1">
                  <Columns3 className="w-3 h-3" />
                  {board._count.columns} {board._count.columns === 1 ? 'column' : 'columns'}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {board._count.members} {board._count.members === 1 ? 'member' : 'members'}
                </span>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
