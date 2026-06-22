'use client';

import { Progress } from '@/components/ui/progress';
import { useMemo } from 'react';
import { useBoardStore } from '@/store/board';
import { DONE_PATTERNS } from '@/lib/projectHealth';

export default function ProgressBar() {
  const columns = useBoardStore((s) => s.columns);

  const { progress, totalTasks, doneTasks } = useMemo(() => {
    const doneColumn =
      columns.find((col) => DONE_PATTERNS.test(col.title.trim())) ??
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
    <div className="flex flex-col gap-1 w-full md:w-52 shrink-0">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">{progress}%</span>
        <span className="text-xs text-muted-foreground">{doneTasks}/{totalTasks} done</span>
      </div>
      <Progress value={progress} className="h-1.5" />
    </div>
  );
}
