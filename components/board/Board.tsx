'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
  // Snapshot of columns at drag start — used to revert on server error.
  // Cannot use `columns` at drop time because onDragOver has already mutated it.
  const preDragColumnsRef = useRef<ColumnWithTasks[]>([]);

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
    preDragColumnsRef.current = columns;
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

    const isActiveAColumn = active.data.current?.type === 'Column';
    if (isActiveAColumn) {
      // Guard against no-op column reorders (column dropped on itself).
      // This check is intentionally NOT applied to task drags: onDragOver moves
      // the task to its new column during the drag, so by the time onDragEnd
      // fires the task is already rendered at the drop position. DnD Kit then
      // reports over.id === active.id (the task is the top droppable under the
      // pointer), which would trigger a false early-return and skip the DB write.
      if (activeId === overId) return;
      const activeIndex = columns.findIndex((c) => c.id === activeId);
      const overIndex = columns.findIndex((c) => c.id === overId);
      if (activeIndex === -1 || overIndex === -1) return;

      const reordered = arrayMove(columns, activeIndex, overIndex);
      setColumns(reordered);

      const updates = reordered.map((col, index) => ({ id: col.id, order: index }));
      updateColumnOrder(board.id, updates).then((result) => {
        if (result?.error) {
          toast.error(result.error);
          setColumns(preDragColumnsRef.current);
        }
      });
      return;
    }

    // This is where we handle task drops

    // Build a pre-drag position index so we can diff against the post-drag state.
    // Excludes temp tasks (using adjusted indices) to match the same filtering
    // applied when building the updates arrays below.
    const preDragMap = new Map<string, { order: number; columnId: string }>();
    for (const col of preDragColumnsRef.current) {
      let realIndex = 0;
      for (const t of col.tasks) {
        if (!t.id.startsWith('temp-')) {
          preDragMap.set(t.id, { order: realIndex, columnId: col.id });
          realIndex++;
        }
      }
    }
    const hasChanged = (u: { id: string; order: number; columnId: string }) => {
      const prev = preDragMap.get(u.id);
      return !prev || prev.order !== u.order || prev.columnId !== u.columnId;
    };

    const activeColumn = columns.find((col) =>
      col.tasks.some((task) => task.id === activeId)
    );
    const overColumn = columns.find((col) =>
      col.tasks.some((task) => task.id === overId) || col.id === overId
    );

    // Cross-column moves: onDragOver already moved the task visually via setColumns,
    // so by the time onDragEnd fires, activeColumn is null (task is in its new column).
    // The columns state is already correct — just persist it to the server.
    if (!activeColumn) {
      if (!overColumn) return;
      const updates = columns.flatMap((col) =>
        col.tasks
          .filter((task) => !task.id.startsWith('temp-'))
          .map((task, index) => ({
            id: task.id,
            order: index,
            columnId: col.id,
          }))
      ).filter(hasChanged);
      if (updates.length > 0) {
        const result = await updateTaskOrder(board.id, updates);
        if (result?.error) {
          toast.error(result.error);
          setColumns(preDragColumnsRef.current);
        }
      }
      return;
    }

    if (!overColumn) return;

    const activeTaskIndex = activeColumn.tasks.findIndex((t) => t.id === activeId);
    const overTaskIndex = overColumn.tasks.findIndex((t) => t.id === overId);

    // Same-column reorder: onDragOver does not handle this case, so onDragEnd
    // performs the optimistic update and persists it.
    let newColumns = [...columns];

    if (activeColumn.id === overColumn.id) {
      const newTasks = arrayMove(activeColumn.tasks, activeTaskIndex, overTaskIndex);
      newColumns = newColumns.map((col) =>
        col.id === activeColumn.id ? { ...col, tasks: newTasks } : col
      );
    } else {
      // Fallback for cross-column drops that onDragOver missed (e.g. drop on empty column).
      const targetIndex = over.data.current?.type === 'Task' ? overTaskIndex : overColumn.tasks.length;
      const movedTask = { ...activeColumn.tasks[activeTaskIndex], columnId: overColumn.id };
      const newActiveTasks = activeColumn.tasks.filter((_, i) => i !== activeTaskIndex);
      const newOverTasks = [
        ...overColumn.tasks.slice(0, targetIndex),
        movedTask,
        ...overColumn.tasks.slice(targetIndex),
      ];
      newColumns = newColumns.map((col) => {
        if (col.id === activeColumn.id) return { ...col, tasks: newActiveTasks };
        if (col.id === overColumn.id) return { ...col, tasks: newOverTasks };
        return col;
      });
    }

    setColumns(newColumns);

    const updates = newColumns.flatMap((col) =>
      col.tasks
        .filter((task) => !task.id.startsWith('temp-'))
        .map((task, index) => ({
          id: task.id,
          order: index,
          columnId: col.id,
        }))
    ).filter(hasChanged);

    if (updates.length > 0) {
      const result = await updateTaskOrder(board.id, updates);
      if (result?.error) {
        toast.error(result.error);
        setColumns(preDragColumnsRef.current);
      }
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

        const movedTask = activeColumn.tasks[activeTaskIndex];
        const newActiveColumn = {
          ...activeColumn,
          tasks: activeColumn.tasks.filter((_, i) => i !== activeTaskIndex),
        };
        const newOverColumn = {
          ...overColumn,
          tasks: [
            ...overColumn.tasks.slice(0, overTaskIndex),
            movedTask,
            ...overColumn.tasks.slice(overTaskIndex),
          ],
        };

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

        const activeTaskIndex = activeColumn.tasks.findIndex((t) => t.id === activeId);
        const movedTask = activeColumn.tasks[activeTaskIndex];
        const newActiveColumn = {
          ...activeColumn,
          tasks: activeColumn.tasks.filter((_, i) => i !== activeTaskIndex),
        };
        const newOverColumn = {
          ...overColumn,
          tasks: [...overColumn.tasks, movedTask],
        };

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