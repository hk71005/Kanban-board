'use client';

import { Progress } from '@/components/ui/progress';
import { useMemo } from 'react';
import { useBoardStore } from '@/store/board';

const DONE_PATTERNS = [
  'done', 'complete', 'completed', 'finished',
  'shipped', 'closed', 'resolved', 'delivered',
];

export default function ProgressBar() {
  const columns = useBoardStore((s) => s.columns);

  const { progress, totalTasks, doneTasks } = useMemo(() => {
    // Match by common "done" names; fall back to the last column.
    const doneColumn =
      columns.find((col) => DONE_PATTERNS.includes(col.title.toLowerCase().trim())) ??
      columns[columns.length - 1] ??
      null;

    const totalTasks = columns.reduce((sum, col) => sum + col.tasks.length, 0);

    if (totalTasks === 0 || !doneColumn) {
      return { progress: 0, totalTasks: 0, doneTasks: 0 };
    }

    const doneTasks = doneColumn.tasks.length;
    const progress = Math.round((doneTasks / totalTasks) * 100);

    return { progress, totalTasks, doneTasks };
  }, [columns]);

  return (
    <div className="flex items-center w-full gap-2 md:w-64">
      <Progress value={progress} className="h-2" />
      <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
        {doneTasks} / {totalTasks}
      </span>
    </div>
  );
}
