import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import db from '@/lib/db';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return new NextResponse('Service not configured', { status: 503 });
  }
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const tasks = await db.task.findMany({
    where: {
      dueDate: { gte: now, lte: in24h },
    },
    include: {
      column: {
        include: {
          board: {
            include: {
              user: { select: { email: true, name: true } },
            },
          },
        },
      },
    },
  });

  // Resolve assignee emails in one query
  const assigneeIds = [...new Set(tasks.map((t) => t.assignee).filter(Boolean))] as string[];
  const assigneeUsers =
    assigneeIds.length > 0
      ? await db.user.findMany({
          where: { id: { in: assigneeIds } },
          select: { id: true, email: true, name: true },
        })
      : [];
  const assigneeById = new Map(assigneeUsers.map((u) => [u.id, u]));

  // Group tasks by recipient email. Each task goes to the board owner; if an
  // assignee exists and their email differs from the owner's, they also receive it.
  // Using email as the map key naturally deduplicates owner == assignee cases.
  const byEmail = new Map<string, {
    name: string | null;
    email: string;
    tasks: typeof tasks;
  }>();

  for (const task of tasks) {
    const { email: ownerEmail, name: ownerName } = task.column.board.user;

    if (!byEmail.has(ownerEmail)) byEmail.set(ownerEmail, { email: ownerEmail, name: ownerName, tasks: [] });
    byEmail.get(ownerEmail)!.tasks.push(task);

    if (task.assignee) {
      const assignee = assigneeById.get(task.assignee);
      if (assignee && assignee.email !== ownerEmail) {
        if (!byEmail.has(assignee.email)) byEmail.set(assignee.email, { email: assignee.email, name: assignee.name, tasks: [] });
        byEmail.get(assignee.email)!.tasks.push(task);
      }
    }
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://kanvi.app';

  const sends = Array.from(byEmail.values()).map(({ email, name, tasks: userTasks }) => {
    const taskRows = userTasks.map((t) => {
      const due = t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
      return `
        <tr>
          <td style="padding:8px 0;font-size:13px;border-bottom:1px solid #f4f4f5;">
            <strong>${t.title}</strong>
            <span style="color:#71717a;font-size:12px;"> — ${t.column.board.title} / ${t.column.title}</span>
          </td>
          <td style="padding:8px 0;font-size:12px;color:#f59e0b;text-align:right;white-space:nowrap;border-bottom:1px solid #f4f4f5;">
            Due ${due}
          </td>
        </tr>`;
    }).join('');

    return resend.emails.send({
      from: 'Kanvi <hello@kanvi.app>',
      to: email,
      subject: `${userTasks.length} task${userTasks.length !== 1 ? 's' : ''} due in the next 24 hours`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#09090b">
          <p style="font-size:18px;font-weight:700;margin:0 0 4px">Tasks due soon</p>
          <p style="font-size:13px;color:#71717a;margin:0 0 24px">
            Hi${name ? ` ${name}` : ''}, here's what's coming up in the next 24 hours.
          </p>
          <table style="width:100%;border-collapse:collapse;">
            <tbody>${taskRows}</tbody>
          </table>
          <div style="margin-top:24px;">
            <a href="${baseUrl}/boards"
               style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600">
              View your boards
            </a>
          </div>
          <p style="font-size:11px;color:#a1a1aa;margin:24px 0 0">
            You're receiving this because you have tasks due soon on Kanvi.
          </p>
        </div>
      `,
    });
  });

  await Promise.allSettled(sends);

  return NextResponse.json({ sent: byEmail.size, tasks: tasks.length });
}
