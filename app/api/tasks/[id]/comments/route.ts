import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import db from '@/lib/db';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const task = await db.task.findFirst({
    where: {
      id,
      column: {
        board: {
          OR: [
            { userId: session.user.id },
            { members: { some: { userId: session.user.id } } },
          ],
        },
      },
    },
    select: { id: true },
  });

  if (!task) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const comments = await db.comment.findMany({
    where: { taskId: id },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(comments);
}
