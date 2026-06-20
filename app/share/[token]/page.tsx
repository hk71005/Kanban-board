import { cache } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { isPast, isToday, startOfDay } from 'date-fns';
import db from '@/lib/db';
import BoardIcon from '@/components/shared/BoardIcon';
import PriorityBadge from '@/components/shared/PriorityBadge';
import { CheckSquare } from 'lucide-react';

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
              labels: { select: { id: true, name: true, color: true } },
              subtasks: { select: { id: true, title: true, completed: true } },
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
  if (!board) return { title: 'Board not found | Kanvi', robots: { index: false } };
  return { title: `${board.title} | Kanvi`, robots: { index: false } };
}

const PRIORITY_ACCENT: Record<string, string> = {
  URGENT: '#ef4444',
  HIGH:   '#f97316',
  MEDIUM: '#f59e0b',
  LOW:    '#60a5fa',
};

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;
  const board = await getBoard(token);

  if (!board) notFound();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="border-b bg-surface px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold text-primary text-lg">Kanvi</Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">View only</span>
          <Link href="/register" className="text-sm font-medium text-primary hover:underline">
            Sign up free →
          </Link>
        </div>
      </header>

      {/* Board title */}
      <div className="px-5 py-4 border-b bg-surface flex items-center gap-3">
        <BoardIcon emoji={board.emoji} size="lg" />
        <h1 className="text-xl font-semibold">{board.title}</h1>
      </div>

      {/* Columns */}
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
                  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;

                  const hasDate = !!task.dueDate;
                  const overdue = hasDate && isPast(startOfDay(new Date(task.dueDate!))) && !isToday(new Date(task.dueDate!));
                  const dueToday = hasDate && isToday(new Date(task.dueDate!));

                  const accentStyle = overdue
                    ? { borderLeftWidth: '4px', borderLeftStyle: 'solid' as const, borderLeftColor: 'hsl(var(--destructive))' }
                    : dueToday
                    ? { borderLeftWidth: '4px', borderLeftStyle: 'solid' as const, borderLeftColor: '#f59e0b' }
                    : { borderLeftWidth: '3px', borderLeftStyle: 'solid' as const, borderLeftColor: PRIORITY_ACCENT[task.priority] ?? '#60a5fa' };

                  const dueDateText = hasDate
                    ? new Date(task.dueDate!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : null;

                  return (
                    <div
                      key={task.id}
                      className="bg-card rounded-lg border border-border shadow-sm p-3 space-y-1.5"
                      style={accentStyle}
                    >
                      <p className="text-sm font-semibold leading-snug">{task.title}</p>

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

                      {/* Footer row: priority + metadata */}
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <PriorityBadge priority={task.priority} />
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {task.subtasks.length > 0 && (
                            <span className="flex items-center gap-1">
                              <CheckSquare className="w-3 h-3" />
                              {completedSubtasks}/{task.subtasks.length}
                            </span>
                          )}
                          {dueDateText && (
                            <span
                              className={
                                overdue
                                  ? 'text-destructive font-medium'
                                  : dueToday
                                  ? 'text-amber-500 font-medium'
                                  : ''
                              }
                            >
                              {dueDateText}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-3 px-5 text-center text-xs text-muted-foreground">
        Shared with{' '}
        <Link href="/" className="text-primary hover:underline font-medium">
          Kanvi
        </Link>
        {' · '}
        <Link href="/register" className="text-primary hover:underline">
          Create your free board
        </Link>
      </footer>
    </div>
  );
}
