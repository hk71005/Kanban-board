'use client';

import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMemo, useState, useTransition } from 'react';
import { MoreHorizontal, Pencil, PlusCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { ColumnWithTasks } from '@/types';
import TaskCard from './TaskCard';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { createTask } from '@/actions/task';
import { deleteColumn, updateColumn } from '@/actions/board';
import { useBoardStore } from '@/store/board';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

interface ColumnProps {
  column: ColumnWithTasks;
}

export default function Column({ column }: ColumnProps) {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(column.title);
  const [isPending, startTransition] = useTransition();
  const { deleteColumnFromStore, renameColumnInStore, addTaskToColumn, deleteTaskFromColumn } = useBoardStore();

  const handleRename = () => {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === column.title) { setIsRenaming(false); return; }
    setIsRenaming(false);
    startTransition(() => {
      updateColumn(column.id, trimmed).then((data) => {
        if (data.error) { toast.error(data.error); setRenameValue(column.title); }
        else renameColumnInStore(column.id, trimmed);
      });
    });
  };

  const handleDeleteColumn = () => {
    startTransition(() => {
      deleteColumn(column.id).then((data) => {
        if (data.error) toast.error(data.error);
        else {
          deleteColumnFromStore(column.id);
          toast.success('Column deleted');
        }
      });
    });
  };

  const tasksIds = useMemo(() => {
    return column.tasks.map((task) => task.id);
  }, [column.tasks]);

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const handleAddTask = () => {
    if (newTaskTitle.trim() === '') return;
    const title = newTaskTitle.trim();
    setNewTaskTitle('');
    setIsAddingTask(false);

    const tempId = `temp-${Date.now()}`;
    addTaskToColumn({
      id: tempId,
      title,
      priority: 'MEDIUM',
      columnId: column.id,
      order: column.tasks.length,
      description: null,
      dueDate: null,
      assignee: null,
      storyPoints: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      labels: [],
      subtasks: [],
      comments: [],
      column: { title: column.title },
    });

    startTransition(() => {
      createTask(column.id, { title, priority: 'MEDIUM' }).then((data) => {
        if (data.error) {
          toast.error(data.error);
          deleteTaskFromColumn(tempId, column.id);
        }
      });
    });
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex flex-col w-[85vw] shrink-0 md:flex-1 md:min-w-[260px] md:w-auto h-full p-2 rounded-lg opacity-40 bg-card border-2 border-primary"
      ></div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col w-[85vw] shrink-0 md:flex-1 md:min-w-[260px] md:w-auto h-full rounded-lg bg-surface snap-start"
    >
      {/* Column Header */}
      <div
        {...(!isRenaming ? attributes : {})}
        {...(!isRenaming ? listeners : {})}
        className="flex items-center justify-between p-3 text-base font-semibold cursor-grab"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: column.color }}
          />
          {isRenaming ? (
            <Input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
                if (e.key === 'Escape') { setIsRenaming(false); setRenameValue(column.title); }
              }}
              className="h-6 py-0 px-1 text-sm font-semibold"
            />
          ) : (
            <span className="truncate">{column.title}</span>
          )}
          <span className="flex items-center justify-center w-5 h-5 text-xs rounded-full bg-card text-muted-foreground shrink-0">
            {column.tasks.length}
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0" aria-label="Column options">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={(e) => { e.preventDefault(); setRenameValue(column.title); setIsRenaming(true); }}
              className="cursor-pointer"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <ConfirmDialog
              trigger={
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete column
                </DropdownMenuItem>
              }
              title="Delete column?"
              description={`This will permanently delete "${column.title}" and all its tasks. This cannot be undone.`}
              confirmText="Delete"
              onConfirm={handleDeleteColumn}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Column Tasks */}
      <div className="flex flex-col flex-grow gap-2 p-2 overflow-y-auto">
        <SortableContext items={tasksIds}>
          {column.tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
        {column.tasks.length === 0 && (
          <div className="flex items-center justify-center flex-1 min-h-[80px] rounded-lg border-2 border-dashed border-muted text-sm text-muted-foreground">
            No tasks
          </div>
        )}
      </div>

      {/* Column Footer */}
      <div className="p-2">
        {isAddingTask ? (
          <div className="flex flex-col gap-2">
            <Input
              autoFocus
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Task title..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTask();
                if (e.key === 'Escape') {
                  setIsAddingTask(false);
                  setNewTaskTitle('');
                }
              }}
              disabled={isPending}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddTask} disabled={isPending} className="flex-1">
                Add
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsAddingTask(false);
                  setNewTaskTitle('');
                }}
                disabled={isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => setIsAddingTask(true)}
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Add task
          </Button>
        )}
      </div>
    </div>
  );
}
