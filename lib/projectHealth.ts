import { isPast, isToday, startOfDay } from 'date-fns';

export type ProjectHealth = 'completed' | 'delayed' | 'awaiting_feedback' | 'on_track';

export type HealthTask = {
  id: string;
  dueDate: Date | string | null;
  needsClient: boolean;
};

export type HealthColumn = {
  title: string;
  tasks: HealthTask[];
};

export const DONE_PATTERNS = /^(done|complete[d]?|delivered|shipped|closed|finished|resolved)$/i;

export function deriveHealth(columns: HealthColumn[]): ProjectHealth {
  if (columns.length === 0) return 'on_track';
  const allTasks = columns.flatMap((c) => c.tasks);
  if (allTasks.length === 0) return 'on_track';

  const doneCol =
    columns.find((c) => DONE_PATTERNS.test(c.title.trim())) ?? columns[columns.length - 1];
  const doneIds = new Set(doneCol.tasks.map((t) => t.id));
  const activeTasks = allTasks.filter((t) => !doneIds.has(t.id));

  if (activeTasks.length === 0) return 'completed';

  const hasDelayed = activeTasks.some((t) => {
    if (!t.dueDate || t.needsClient) return false;
    const d = new Date(t.dueDate);
    return isPast(startOfDay(d)) && !isToday(d);
  });
  if (hasDelayed) return 'delayed';

  if (activeTasks.some((t) => t.needsClient)) return 'awaiting_feedback';

  return 'on_track';
}
