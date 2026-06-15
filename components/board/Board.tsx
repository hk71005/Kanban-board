'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  KeyboardSensor,
} from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import { createPortal } from 'react-dom';

import { useBoardStore } from '@/store/board';
import { BoardWithDetails, ColumnWithTasks, TaskWithDetails } from '@/types';
import Column from './Column';
import { updateTaskOrder } from '@/actions/task';
import { updateColumnOrder } from '@/actions/board';
import { toast } from 'sonner';
import DragOverlay from './DragOverlay';
import BoardHeader from './BoardHeader';
import dynamic from 'next/dynamic';
const TaskDialog = dynamic(() => import('@/components/tasks/TaskDialog'), { ssr: false });

interface BoardProps {
  initialBoardData: BoardWithDetails;
  currentUserId: string;
}

export default function Board({ initialBoardData, currentUserId }: BoardProps) {
  const { board, columns, setBoard, setCurrentUserId, setColumns, searchQuery, priorityFilters, assigneeFilter } = useBoardStore((state) => state);
  const [activeColumn, setActiveColumn] = useState<ColumnWithTasks | null>(null);
  const [activeTask, setActiveTask] = useState<TaskWithDetails | null>(null);

  useEffect(() => {
    setBoard(initialBoardData);
    setCurrentUserId(currentUserId);
  }, [initialBoardData, currentUserId, setBoard, setCurrentUserId]);

  const columnsId = useMemo(() => columns.map((col) => col.id), [columns]);

  const filteredColumns = useMemo(() => {
    if (!searchQuery && priorityFilters.length === 0 && !assigneeFilter) return columns;
    return columns.map((col) => ({
      ...col,
      tasks: col.tasks.filter((task) => {
        const matchesSearch =
          !searchQuery || task.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPriority =
          priorityFilters.length === 0 || priorityFilters.includes(task.priority);
        const matchesAssignee =
          !assigneeFilter || task.assignee === assigneeFilter;
        return matchesSearch && matchesPriority && matchesAssignee;
      }),
    }));
  }, [columns, searchQuery, priorityFilters, assigneeFilter]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10, // 10px
      },
    }),
    useSensor(KeyboardSensor)
  );

  if (!board) {
    return null; // or a loading state
  }

  const onDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === 'Column') {
      setActiveColumn(event.active.data.current.column);
      return;
    }
    if (event.active.data.current?.type === 'Task') {
      setActiveTask(event.active.data.current.task);
      return;
    }
  };

  const onDragEnd = async (event: DragEndEvent) => {
    setActiveColumn(null);
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveAColumn = active.data.current?.type === 'Column';
    if (isActiveAColumn) {
      const activeIndex = columns.findIndex((c) => c.id === activeId);
      const overIndex = columns.findIndex((c) => c.id === overId);
      if (activeIndex === -1 || overIndex === -1) return;

      const reordered = arrayMove(columns, activeIndex, overIndex);
      setColumns(reordered);

      const updates = reordered.map((col, index) => ({ id: col.id, order: index }));
      updateColumnOrder(board.id, updates).then((result) => {
        if (result?.error) {
          toast.error(result.error);
          setColumns(columns);
        }
      });
      return;
    }

    // This is where we handle task drops
    const activeColumn = columns.find((col) =>
      col.tasks.some((task) => task.id === activeId)
    );
    const overColumn = columns.find((col) =>
      col.tasks.some((task) => task.id === overId) || col.id === overId
    );

    if (!activeColumn || !overColumn) return;

    const activeTaskIndex = activeColumn.tasks.findIndex((t) => t.id === activeId);
    const overTaskIndex = overColumn.tasks.findIndex((t) => t.id === overId);

    let newColumns = [...columns];
    let movedTask: TaskWithDetails;

    // Moving within the same column
    if (activeColumn.id === overColumn.id) {
      const newTasks = arrayMove(activeColumn.tasks, activeTaskIndex, overTaskIndex);
      newColumns = newColumns.map((col) =>
        col.id === activeColumn.id ? { ...col, tasks: newTasks } : col
      );
    } else { // Moving to a different column
      [movedTask] = activeColumn.tasks.splice(activeTaskIndex, 1);
      movedTask.columnId = overColumn.id;
      
      const targetIndex = over.data.current?.type === 'Task' ? overTaskIndex : overColumn.tasks.length;
      overColumn.tasks.splice(targetIndex, 0, movedTask);

      newColumns = newColumns.map((col) => {
        if (col.id === activeColumn.id) return { ...col, tasks: activeColumn.tasks };
        if (col.id === overColumn.id) return { ...col, tasks: overColumn.tasks };
        return col;
      });
    }

    setColumns(newColumns);

    // Optimistic update done, now call server action
    const updates = newColumns.flatMap(col => 
      col.tasks.map((task, index) => ({
        id: task.id,
        order: index,
        columnId: col.id,
      }))
    );

    const result = await updateTaskOrder(board.id, updates);
    if (result?.error) {
      toast.error(result.error);
      // Revert state on error
      setBoard(initialBoardData);
    }
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveATask = active.data.current?.type === 'Task';
    const isOverATask = over.data.current?.type === 'Task';
    const isOverAColumn = over.data.current?.type === 'Column';

    if (!isActiveATask) return;

    // Dropping a Task over another Task
    if (isActiveATask && isOverATask) {
      setColumns((prevColumns: ColumnWithTasks[]) => {
        const activeColumn = prevColumns.find((col) => col.tasks.some((t) => t.id === activeId));
        const overColumn = prevColumns.find((col) => col.tasks.some((t) => t.id === overId));

        if (!activeColumn || !overColumn || activeColumn.id === overColumn.id) {
          return prevColumns;
        }

        const activeTaskIndex = activeColumn.tasks.findIndex((t) => t.id === activeId);
        const overTaskIndex = overColumn.tasks.findIndex((t) => t.id === overId);

        const newActiveColumn = { ...activeColumn };
        const newOverColumn = { ...overColumn };

        const [movedTask] = newActiveColumn.tasks.splice(activeTaskIndex, 1);
        newOverColumn.tasks.splice(overTaskIndex, 0, movedTask);

        return prevColumns.map((col) => {
          if (col.id === newActiveColumn.id) return newActiveColumn;
          if (col.id === newOverColumn.id) return newOverColumn;
          return col;
        });
      });
    }

    // Dropping a Task over a Column
    if (isActiveATask && isOverAColumn) {
      setColumns((prevColumns: ColumnWithTasks[]) => {
        const activeColumn = prevColumns.find((col) => col.tasks.some((t) => t.id === activeId));
        const overColumn = prevColumns.find((col) => col.id === overId);

        if (!activeColumn || !overColumn || activeColumn.id === overColumn.id) {
          return prevColumns;
        }

        const newActiveColumn = { ...activeColumn };
        const newOverColumn = { ...overColumn };

        const activeTaskIndex = newActiveColumn.tasks.findIndex((t) => t.id === activeId);
        const [movedTask] = newActiveColumn.tasks.splice(activeTaskIndex, 1);
        newOverColumn.tasks.push(movedTask);

        return prevColumns.map((col) => {
          if (col.id === newActiveColumn.id) return newActiveColumn;
          if (col.id === newOverColumn.id) return newOverColumn;
          return col;
        });
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <TaskDialog />
      <BoardHeader board={board} currentUserId={currentUserId} />
      <div className="flex-1 overflow-x-auto snap-x snap-mandatory scroll-smooth px-4 py-4">
        <DndContext
          sensors={sensors}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragOver={onDragOver}
        >
          <div className="flex h-full gap-4 min-w-full">
            <SortableContext items={columnsId}>
              {filteredColumns.map((col) => (
                <Column key={col.id} column={col} />
              ))}
            </SortableContext>
          </div>
          {createPortal(
            <DragOverlay activeColumn={activeColumn} activeTask={activeTask} />,
            document.body
          )}
        </DndContext>
      </div>
    </div>
  );
}