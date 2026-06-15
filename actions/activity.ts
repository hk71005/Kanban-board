'use server';

import { auth } from '@/lib/auth';
import db from '@/lib/db';

export async function getActivityLogs(taskId: string) {
  const session = await auth();
  if (!session?.user?.id) return { logs: [] };

  try {
    const logs = await db.activityLog.findMany({
      where: { taskId },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return { logs };
  } catch {
    return { logs: [] };
  }
}
