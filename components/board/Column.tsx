'use client';

import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { ChevronRight, ChevronDown, MoreHorizontal, Pencil, PlusCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { ColumnWithTasks } from '@/types';
import TaskCard from './TaskCard';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { createTask } from '@/actions/task';
import { deleteColumn, updateColumn } from '@/actions/board';
import { useBoardStore } from '@/store/board';
import { useUIStore } from '@/store/ui';
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
  const [mounted, setMounted] = useState(false);
  const {
    deleteColumnFromStore, renameColumnInStore, addTaskToColumn, deleteTaskFromColumn,
    searchQuery, setSearchQuery, priorityFilters, setPriorityFilters, assigneeFilter, setAssigneeFilter,
  } = useBoardStore();
  const { collapsedColumns, toggleColumn } = useUIStore();

  useEffect(() => { setMounted(true); }, []);

  const isCollapsed = mounted && !!collapsedColumns[column.id];
  const isEffectivelyCollapsed = isCollapsed && !searchQuery;

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

  useEffect(() => {
    const handler = (e: Event) => {
      const { columnId } = (e as CustomEvent<{ columnId: string }>).detail ?? {};
      if (columnId === column.id) setIsAddingTask(true);
    };
    window.addEventListener('kanvi:quick-add', handler);
    return () => window.removeEventListener('kanvi:quick-add', handler);
  }, [column.id]);

  const tasksIds = useMemo(() => column.tasks.map((task) => task.id), [column.tasks]);

  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: { type: 'Column', column },
  });

  const style = { transition, transform: CSS.Transform.toString(transform) };

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
      needsClient: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      labels: [],
      subtasks: [],
      comments: [],
      column: { title: column.title },
    });

    startTransition(() => {
      createTask(column.id, { title, priority: 'MEDIUM', needsClient: false }).then((data) => {
        if (data.error) {
          toast.error(data.error);
          deleteTaskFromColumn(tempId, column.id);
        }
      });
    });
  };

  // ── Drag ghost placeholder (position held during drag) ───────────────
  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'shrink-0 rounded-lg opacity-40 bg-card border-2 border-primary snap-start',
          isEffectivelyCollapsed
            ? 'w-12 md:w-14 h-36 self-start'
            : 'w-[85vw] md:flex-1 md:min-w-[260px] md:w-auto h-full'
        )}
      />
    );
  }

  // ── Collapsed: sleek vertical tab ────────────────────────────────────
  if (isEffectivelyCollapsed) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex flex-col w-12 md:w-14 shrink-0 self-start rounded-lg bg-surface snap-start ring-1 ring-black/5 dark:ring-white/[0.05]"
      >
        {/* The entire rail is the drag handle for column reordering */}
        <div
          className="flex flex-col items-center gap-1.5 py-2 px-1 cursor-grab select-none"
          {...attributes}
          {...listeners}
        >
          {/* Expand toggle */}
          <button
            type="button"
            onClick={() => toggleColumn(column.id)}
            className="flex items-center justify-center w-full min-h-[44px] md:min-h-[32px] rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0"
            aria-label={`Expand ${column.title}`}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Column color indicator */}
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: column.color }}
          />

          {/* Column title — vertical reading direction */}
          <span
            className="flex-1 text-[11px] font-semibold text-muted-foreground overflow-hidden"
            style={{
              writingMode: 'vertical-lr',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxHeight: '9rem',
            }}
          >
            {column.title}
          </span>

          {/* Task count badge */}
          <span className="inline-flex items-center justify-center min-w-[1.25rem] px-1 py-0.5 text-[10px] font-semibold rounded-full bg-muted text-muted-foreground shrink-0 tabular-nums">
            {column.tasks.length}
          </span>
        </div>
      </div>
    );
  }

  // ── Expanded: full column layout ─────────────────────────────────────
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col w-[85vw] shrink-0 md:flex-1 md:min-w-[260px] md:w-auto h-full rounded-lg bg-surface snap-start ring-1 ring-black/5 dark:ring-white/[0.05]"
    >
      {/* Column Header */}
      <div
        {...(!isRenaming ? attributes : {})}
        {...(!isRenaming ? listeners : {})}
        className="flex items-center justify-between p-3 text-base font-semibold cursor-grab"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: column.color }} />
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
          <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full bg-muted text-muted-foreground shrink-0 min-w-[1.25rem]">
            {column.tasks.length}
          </span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-[44px] w-[44px] md:h-7 md:w-7"
            onClick={() => toggleColumn(column.id)}
            aria-label="Collapse column"
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
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
      </div>

      {/* Column Tasks */}
      <div className="flex flex-col flex-grow gap-2 p-2 overflow-y-auto">
        <SortableContext items={tasksIds}>
          {column.tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>

        {column.tasks.length === 0 && (
          searchQuery ? (
            <div className="flex flex-col items-center justify-center py-3 gap-1.5 text-center">
              <span className="text-xs text-muted-foreground">No tasks match &ldquo;{searchQuery}&rdquo;</span>
              <button onClick={() => setSearchQuery('')} className="text-xs text-primary hover:underline">
                Clear search
              </button>
            </div>
          ) : priorityFilters.length > 0 || !!assigneeFilter ? (
            <div className="flex flex-col items-center justify-center py-3 gap-1.5 text-center">
              <span className="text-xs text-muted-foreground">No tasks match your filters.</span>
              <button
                onClick={() => { setPriorityFilters([]); setAssigneeFilter(null); }}
                className="text-xs text-primary hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            /* Lean drop zone — just enough area for dnd-kit detection; no visual bloat */
            <div
              className="flex-1 min-h-[52px] rounded-md border border-dashed border-muted/40 hover:border-primary/30 hover:bg-primary/5 transition-colors duration-150 cursor-pointer"
              onClick={() => setIsAddingTask(true)}
              aria-label="Drop task here or click to add"
            />
          )
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
                if (e.key === 'Escape') { setIsAddingTask(false); setNewTaskTitle(''); }
              }}
              disabled={isPending}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddTask} disabled={isPending} className="flex-1">
                Add
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setIsAddingTask(false); setNewTaskTitle(''); }} disabled={isPending}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start border border-dashed border-muted-foreground/20 text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground transition-colors min-h-[44px]"
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
