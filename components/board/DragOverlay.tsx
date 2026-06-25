'use client';

import { DragOverlay as DndDragOverlay } from '@dnd-kit/core';
import { Clock, Check } from 'lucide-react';

import { ColumnWithTasks, TaskWithDetails } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import PriorityBadge from '../shared/PriorityBadge';

interface DragOverlayProps {
  activeColumn: ColumnWithTasks | null;
  activeTask: TaskWithDetails | null;
}

// Lightweight previews — no useSortable so we don't double-register the same
// draggable ID (which causes dnd-kit to fire duplicate events → React #185).

function TaskPreview({ task }: { task: TaskWithDetails }) {
  return (
    <Card className="rounded-lg shadow-xl cursor-grabbing rotate-1 opacity-95">
      <CardHeader className="p-3 pb-1.5">
        <p className="text-sm font-semibold leading-snug">{task.title}</p>
      </CardHeader>
      <CardContent className="px-3 pb-2.5 pt-0">
        {(task.needsClient || task.clientReviewedAt) && (
          <div className="mb-1.5 flex flex-col gap-1">
            {task.needsClient && !task.clientReviewedAt && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
                <Clock className="w-3 h-3" />
                Waiting on client
              </span>
            )}
            {task.clientReviewedAt && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                <Check className="w-3 h-3" />
                Client reviewed
              </span>
            )}
          </div>
        )}
        <PriorityBadge priority={task.priority} />
      </CardContent>
    </Card>
  );
}

function ColumnPreview({ column }: { column: ColumnWithTasks }) {
  return (
    <div className="flex flex-col w-[85vw] shrink-0 md:flex-1 md:min-w-[260px] md:w-auto h-full rounded-lg bg-surface ring-1 ring-black/5 dark:ring-white/[0.05] shadow-xl rotate-1 opacity-90">
      <div className="flex items-center gap-2 p-3">
        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: column.color }} />
        <span className="text-base font-semibold truncate">{column.title}</span>
        <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full bg-muted text-muted-foreground shrink-0">
          {column.tasks.length}
        </span>
      </div>
    </div>
  );
}

export default function DragOverlay({ activeColumn, activeTask }: DragOverlayProps) {
  return (
    <DndDragOverlay>
      {activeColumn && <ColumnPreview column={activeColumn} />}
      {activeTask && <TaskPreview task={activeTask} />}
    </DndDragOverlay>
  );
}
