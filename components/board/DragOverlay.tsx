import { DragOverlay as DndDragOverlay } from '@dnd-kit/core';
import { ColumnWithTasks, TaskWithDetails } from '@/types';
import Column from './Column';
import TaskCard from './TaskCard';

interface DragOverlayProps {
  activeColumn: ColumnWithTasks | null;
  activeTask: TaskWithDetails | null;
}

export default function DragOverlay({
  activeColumn,
  activeTask,
}: DragOverlayProps) {
  return (
    <DndDragOverlay>
      {activeColumn && <Column column={activeColumn} />}
      {activeTask && <TaskCard task={activeTask} />}
    </DndDragOverlay>
  );
}