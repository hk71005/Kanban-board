import { cache } from 'react';
import Link from 'next/link';
import { formatDistanceToNow, isPast, isToday, startOfDay } from 'date-fns';
import db from '@/lib/db';
import BoardIcon from '@/components/shared/BoardIcon';
import { ArrowRight, Bell, Clock } from 'lucide-react';
import { deriveHealth, type ProjectHealth } from '@/lib/projectHealth';

interface SharePageProps {
  params: Promise<{ token: string }>;
}

// Cached so generateMetadata and SharePage share one DB round trip per request.
const getBoard = cache(async (token: string) => {
  return db.board.findUnique({
    where: { shareToken: token },
    select: {
      title: true,
      emoji: true,
      updatedAt: true,
      user: { select: { name: true } },
      columns: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          title: true,
          color: true,
          order: true,
          tasks: {
            orderBy: { order: 'asc' },
            select: {
              id: true,
              title: true,
              description: true,
              priority: true,
              dueDate: true,
              needsClient: true,
              labels: { select: { id: true, name: true, color: true } },
              subtasks: { select: { id: true, completed: true } },
            },
          },
        },
      },
    },
  });
});

export async function generateMetadata({ params }: SharePageProps) {
  const { token } = await params;
  const board = await getBoard(token);
  if (!board) return { title: 'Board not found | Kanvi', robots: { index: false }, referrer: 'no-referrer' as const };
  return { title: `${board.title} | Kanvi`, robots: { index: false }, referrer: 'no-referrer' as const };
}

function ownerInitials(name: string | null): string {
  if (!name) return 'FL';
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join('');
}

const STATUS_CONFIG: Record<ProjectHealth, { label: string; badgeCls: string; dotCls: string }> = {
  completed: {
    label: 'Completed',
    badgeCls: 'bg-primary/10 text-primary',
    dotCls: 'bg-primary',
  },
  delayed: {
    label: 'Delayed',
    badgeCls: 'bg-destructive/10 text-destructive',
    dotCls: 'bg-destructive',
  },
  awaiting_feedback: {
    label: 'Waiting on you',
    badgeCls: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
    dotCls: 'bg-amber-400',
  },
  on_track: {
    label: 'On track',
    badgeCls: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
    dotCls: 'bg-emerald-500',
  },
};

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;
  const board = await getBoard(token);
  if (!board) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
        <p className="text-base font-bold text-primary mb-6">Kanvi</p>
        <h1 className="text-xl font-semibold mb-2">This link is no longer active</h1>
        <p className="text-sm text-muted-foreground max-w-xs">
          The board may have been deleted or this share link was revoked by the owner.
        </p>
      </div>
    );
  }

  // ── Derived data ─────────────────────────────────────────────────────────
  const ownerName = board.user.name ?? 'Your freelancer';
  const initials = ownerInitials(board.user.name);
  const updatedAgo = formatDistanceToNow(new Date(board.updatedAt), { addSuffix: true });

  const allTasks = board.columns.flatMap((c) => c.tasks);
  const totalTasks = allTasks.length;

  // Column identification by name pattern (for UI only — not health logic)
  const doneCol =
    board.columns.find((c) =>
      /^(done|complete[d]?|delivered|shipped|closed|finished|resolved)$/i.test(c.title.trim())
    ) ?? board.columns[board.columns.length - 1];

  const inProgressCol = board.columns.find((c) =>
    /in[\s-]?progress|doing|active|working/i.test(c.title)
  );

  const doneTasks = doneCol?.tasks ?? [];
  const completedCount = doneTasks.length;
  const progressPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // Health derived from data, not column-name guessing
  const status = deriveHealth(board.columns);

  // Client action tasks (data-driven, not column-name based)
  const clientActionTasks = allTasks.filter((t) => t.needsClient).slice(0, 3);

  // Next upcoming due date across non-done tasks
  const doneTaskIds = new Set(doneTasks.map((t) => t.id));
  const upcomingDue =
    allTasks
      .filter(
        (t) =>
          t.dueDate != null &&
          !doneTaskIds.has(t.id) &&
          (!isPast(startOfDay(new Date(t.dueDate))) || isToday(new Date(t.dueDate)))
      )
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())[0]
      ?.dueDate ?? null;

  const nextDueText = upcomingDue
    ? new Date(upcomingDue).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : null;

  // What's next card — in-progress column or first non-done column
  const nextTasks = (
    inProgressCol?.tasks.length
      ? inProgressCol.tasks
      : board.columns.find((c) => c !== doneCol)?.tasks ?? []
  ).slice(0, 2);

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Header — freelancer identity ───────────────────────────────── */}
      <header className="border-b bg-surface px-5 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold shrink-0">
            {initials}
          </span>
          <span className="text-sm font-semibold truncate">{ownerName}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
          Updated {updatedAgo}
        </div>
      </header>

      {/* ── Project section ─────────────────────────────────────────────── */}
      <section className="px-5 pt-5 pb-4 border-b">
        <div className="flex items-center gap-3 mb-4">
          <BoardIcon emoji={board.emoji} size="lg" />
          <h1 className="text-xl font-semibold">{board.title}</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[status].badgeCls}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[status].dotCls}`} />
            {STATUS_CONFIG[status].label}
          </span>
          {nextDueText && (
            <span className="text-xs text-muted-foreground">
              Next milestone: {nextDueText}
            </span>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">Progress</span>
            <span className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{completedCount} of {totalTasks}</span>
              {' '}{totalTasks === 1 ? 'task' : 'tasks'} complete
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </section>

      {/* ── Summary cards ───────────────────────────────────────────────── */}
      {(nextTasks.length > 0 || clientActionTasks.length > 0) && (
        <section className="px-5 py-4 border-b bg-surface/30">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
            {nextTasks.length > 0 && (
              <div className="rounded-lg border border-border bg-background p-3.5">
                <div className="flex items-center gap-2 mb-2.5">
                  <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
                  <span className="text-xs font-semibold">What&apos;s next</span>
                </div>
                <ul className="space-y-1.5">
                  {nextTasks.map((t) => (
                    <li key={t.id} className="text-xs text-muted-foreground leading-snug truncate">
                      {t.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {clientActionTasks.length > 0 && (
              <div className="rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20 p-3.5">
                <div className="flex items-center gap-2 mb-2.5">
                  <Bell className="w-3.5 h-3.5 text-amber-500 shrink-0" aria-hidden="true" />
                  <span className="text-xs font-semibold">Action required</span>
                </div>
                <ul className="space-y-1.5">
                  {clientActionTasks.map((t) => (
                    <li key={t.id} className="text-xs text-muted-foreground leading-snug truncate">
                      {t.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Board ───────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-4 p-4 h-full min-h-[400px]">
          {board.columns.map((col) => (
            <div
              key={col.id}
              className="flex-shrink-0 w-72 flex flex-col bg-surface rounded-xl border border-border/60"
            >
              {/* Column header */}
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/40">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: col.color }}
                />
                <span className="font-medium text-sm truncate">{col.title}</span>
                <span className="ml-auto text-xs text-muted-foreground">{col.tasks.length}</span>
              </div>

              {/* Tasks */}
              <div className="flex flex-col gap-2 p-2 overflow-y-auto flex-1">
                {col.tasks.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">No tasks</p>
                )}
                {col.tasks.map((task) => {
                  const hasDate = !!task.dueDate;
                  const overdue =
                    hasDate &&
                    isPast(startOfDay(new Date(task.dueDate!))) &&
                    !isToday(new Date(task.dueDate!));
                  const dueToday = hasDate && isToday(new Date(task.dueDate!));

                  const dueDateText = hasDate
                    ? new Date(task.dueDate!).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })
                    : null;

                  return (
                    <div
                      key={task.id}
                      className="bg-card rounded-lg border border-border shadow-sm p-3 space-y-1.5"
                      style={{
                        borderLeftWidth: '3px',
                        borderLeftStyle: 'solid',
                        borderLeftColor: overdue
                          ? 'hsl(var(--destructive))'
                          : dueToday
                          ? '#f59e0b'
                          : 'transparent',
                      }}
                    >
                      <p className="text-sm font-semibold leading-snug">{task.title}</p>
                      {task.needsClient && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
                          <Clock className="w-3 h-3" />
                          Action required
                        </span>
                      )}

                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">
                          {task.description}
                        </p>
                      )}

                      {task.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {task.labels.map((label) => (
                            <span
                              key={label.id}
                              className="text-[10px] px-1.5 py-0 h-4 inline-flex items-center rounded-full font-medium"
                              style={{ backgroundColor: label.color, color: '#fff' }}
                            >
                              {label.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {dueDateText && (
                        <p
                          className={`text-xs ${
                            overdue
                              ? 'text-destructive font-medium'
                              : dueToday
                              ? 'text-amber-500 font-medium'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {overdue ? 'Overdue · ' : dueToday ? 'Due today · ' : ''}
                          {dueDateText}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t py-3 px-5 text-center">
        <Link
          href="/"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Made with Kanvi
        </Link>
      </footer>

    </div>
  );
}
