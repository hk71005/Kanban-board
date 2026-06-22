import { auth } from '@/lib/auth';
import db from '@/lib/db';
import Navbar from '@/components/layout/Navbar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    // This should be handled by middleware, but as a fallback
    return null;
  }

  const userBoards = await db.board.findMany({
    where: {
      OR: [
        { userId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
    select: {
      id: true,
      title: true,
      emoji: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  return (
    <div className="flex flex-col h-screen bg-background">
      <Navbar user={session.user} boards={userBoards} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}