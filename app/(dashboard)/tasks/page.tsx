import { auth } from '@/lib/auth';
import db from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow, isToday, isPast, isThisWeek } from 'date-fns';
import { AlertCircle, Calendar, CheckCircle2, Clock, ExternalLink, Inbox } from 'lucide-react';
import BoardIcon from '@/components/shared/BoardIcon';

const PRIORITY_LABEL: Record<string, string> = {
  URGENT: 'Urgent',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
};

const PRIORITY_COLOR: Record<string, string> = {
  URGENT: 'text-red-500 bg-red-500/10',
  HIGH: 'text-orange-500 bg-orange-500/10',
  MEDIUM: 'text-yellow-500 bg-yellow-500/10',
  LOW: 'text-blue-400 bg-blue-400/10',
};

export const metadata = { title: 'My Tasks | Kanvi' };

export default async function MyTasksPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const tasks = await db.task.findMany({
    where: {
      OR: [
        { column: { board: { userId: session.user.id } } },
        { column: { board: { members: { some: { userId: session.user.id } } } } },
        { assignee: session.user.id },
      ],
    },
    include: {
      column: {
        include: {
          board: { select: { id: true, title: true, emoji: true } },
        },
      },
    },
    orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
  });

  const now = new Date();

  const waitingOnClient = tasks.filter((t) => t.needsClient);
  const waitingIds = new Set(waitingOnClient.map((t) => t.id));

  const overdue = tasks.filter((t) => !waitingIds.has(t.id) && t.dueDate && isPast(t.dueDate) && !isToday(t.dueDate));
  const dueToday = tasks.filter((t) => !waitingIds.has(t.id) && t.dueDate && isToday(t.dueDate));
  const thisWeek = tasks.filter((t) => !waitingIds.has(t.id) && t.dueDate && !isPast(t.dueDate) && !isToday(t.dueDate) && isThisWeek(t.dueDate, { weekStartsOn: 1 }));
  const later = tasks.filter((t) => !waitingIds.has(t.id) && t.dueDate && !isPast(t.dueDate) && !isToday(t.dueDate) && !isThisWeek(t.dueDate, { weekStartsOn: 1 }));
  const noDueDate = tasks.filter((t) => !waitingIds.has(t.id) && !t.dueDate);

  const groups = [
    { label: 'Waiting on Client', icon: <Clock className="w-4 h-4 text-amber-500" />, tasks: waitingOnClient, accent: 'border-amber-500/30' },
    { label: 'Overdue', icon: <AlertCircle className="w-4 h-4 text-destructive" />, tasks: overdue, accent: 'border-destructive/30' },
    { label: 'Due Today', icon: <Clock className="w-4 h-4 text-amber-500" />, tasks: dueToday, accent: 'border-amber-500/30' },
    { label: 'This Week', icon: <Calendar className="w-4 h-4 text-primary" />, tasks: thisWeek, accent: 'border-primary/30' },
    { label: 'Later', icon: <Calendar className="w-4 h-4 text-muted-foreground" />, tasks: later, accent: 'border-border' },
    { label: 'No Due Date', icon: <Inbox className="w-4 h-4 text-muted-foreground" />, tasks: noDueDate, accent: 'border-border' },
  ].filter((g) => g.tasks.length > 0);

  return (
    <div className="container py-10 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Tasks</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} across all your boards
        </p>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <CheckCircle2 className="w-12 h-12 text-primary/30 mb-4" />
          <h2 className="text-lg font-semibold mb-2">No tasks yet</h2>
          <p className="text-muted-foreground text-sm max-w-xs">
            Tasks from all your boards appear here — grouped by due date so nothing slips through.
          </p>
          <Link
            href="/boards"
            className="mt-6 text-sm font-medium text-primary underline underline-offset-4"
          >
            Go to boards
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.label}>
              <div className="flex items-center gap-2 mb-3">
                {group.icon}
                <h2 className="text-sm font-semibold">{group.label}</h2>
                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                  {group.tasks.length}
                </span>
              </div>
              <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
                {group.tasks.map((task) => (
                  <Link
                    key={task.id}
                    href={`/boards/${task.column.board.id}?task=${task.id}`}
                    className="flex items-center gap-4 px-4 py-3 bg-card hover:bg-muted/40 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <BoardIcon emoji={task.column.board.emoji} size="sm" className="w-4 h-4 bg-transparent p-0 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground truncate">
                          {task.column.board.title} · {task.column.title}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${PRIORITY_COLOR[task.priority]}`}>
                        {PRIORITY_LABEL[task.priority]}
                      </span>
                      {task.dueDate && (
                        <span className={`text-xs whitespace-nowrap ${group.label === 'Overdue' ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
                        </span>
                      )}
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
