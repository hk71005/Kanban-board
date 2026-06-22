'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRef, useTransition, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { AlertCircle, CalendarIcon, Check, Clock, Loader2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Priority } from '@prisma/client';

import { taskSchema } from '@/lib/validations';
import { updateTask, deleteTask, toggleNeedsClient } from '@/actions/task';
import { TaskWithDetails } from '@/types';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import SubtaskList from './SubtaskList';
import LabelPicker from './LabelPicker';
import { useBoardStore } from '@/store/board';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

interface TaskFormProps {
  task: TaskWithDetails;
}

export default function TaskForm({ task }: TaskFormProps) {
  const [isPending, startTransition] = useTransition();
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveStateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDeletingRef = useRef(false);
  // Tracks whether this component is still mounted so that async save callbacks
  // (which resolve 400ms+ after the user closes the dialog) don't fire
  // setActiveTask() and accidentally re-open the closed dialog.
  const isMountedRef = useRef(true);
  // Updated on every render so the useEffect cleanup always has current values.
  const flushRef = useRef<(() => void) | null>(null);
  const { setActiveTask, deleteTaskFromColumn, board, updateTaskInColumn } = useBoardStore();

  const currentUserId = useBoardStore((s) => s.currentUserId);
  const myMember = board?.members.find((m) => m.user.id === currentUserId);
  const canEdit = !!myMember && myMember.role !== 'VIEWER';
  const members = board?.members ?? [];

  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task.title || '',
      description: task.description || '',
      priority: task.priority || Priority.MEDIUM,
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
      storyPoints: task.storyPoints || null,
      assignee: task.assignee ?? null,
      needsClient: task.needsClient ?? false,
      labels: task.labels.map((l) => ({ name: l.name, color: l.color })),
    },
  });

  const showSaveState = (next: 'saved' | 'error') => {
    if (saveStateTimerRef.current) clearTimeout(saveStateTimerRef.current);
    setSaveState(next);
    saveStateTimerRef.current = setTimeout(() => setSaveState('idle'), next === 'error' ? 4000 : 2000);
  };

  // Keep flushRef current on every render. The useEffect cleanup reads this ref
  // so it always has the latest form values and store references at unmount time.
  flushRef.current = () => {
    if (!canEdit || isDeletingRef.current || !form.formState.isDirty) return;
    const vals = form.getValues();
    updateTask(task.id, vals).then((result) => {
      if (result.success) {
        updateTaskInColumn({
          ...task,
          title: vals.title,
          description: vals.description ?? null,
          priority: vals.priority,
          dueDate: vals.dueDate ?? null,
          storyPoints: vals.storyPoints ?? null,
          assignee: vals.assignee ?? null,
          needsClient: vals.needsClient ?? false,
          labels: (vals.labels ?? []).map((l, i) => ({
            id: `${task.id}-label-${i}`,
            name: l.name,
            color: l.color,
            taskId: task.id,
          })),
        });
      }
    });
  };

  // On unmount: cancel pending timers and flush any unsaved changes.
  // This covers the case where the dialog is closed (via Escape or programmatic
  // setActiveTask(null)) before the 400ms debounce fires.
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (saveStateTimerRef.current) clearTimeout(saveStateTimerRef.current);
      flushRef.current?.();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = (values: z.infer<typeof taskSchema>) => {
    startTransition(() => {
      updateTask(task.id, values).then((data) => {
        if (data.error) {
          toast.error(data.error);
          if (isMountedRef.current) showSaveState('error');
          return;
        }
        if (data.success) {
          const updatedTask: TaskWithDetails = {
            ...task,
            title: values.title,
            description: values.description ?? null,
            priority: values.priority,
            dueDate: values.dueDate ?? null,
            storyPoints: values.storyPoints ?? null,
            assignee: values.assignee ?? null,
            needsClient: values.needsClient ?? false,
            labels: (values.labels ?? []).map((l, i) => ({
              id: `${task.id}-label-${i}`,
              name: l.name,
              color: l.color,
              taskId: task.id,
            })),
          };
          // Always sync the board columns — safe to call even after dialog closes.
          updateTaskInColumn(updatedTask);
          // Only update dialog-local state if the dialog is still open.
          // Without this guard, a background save resolving after close calls
          // setActiveTask() and re-opens the dialog unexpectedly.
          if (isMountedRef.current) {
            setActiveTask(updatedTask);
            form.reset(values);
            showSaveState('saved');
          }
        }
      });
    });
  };

  // Schedules a save unconditionally — for explicit field changes (Select, Calendar).
  const queueSave = () => {
    if (isDeletingRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (!isDeletingRef.current) form.handleSubmit(onSubmit)();
    }, 400);
  };

  // For the form's onBlur — only saves when something actually changed.
  const debouncedSave = () => {
    if (!canEdit || isDeletingRef.current) return;
    if (!form.formState.isDirty) return;
    queueSave();
  };

  const handleDelete = () => {
    isDeletingRef.current = true;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    startTransition(() => {
      deleteTask(task.id).then((data) => {
        if (data.error) toast.error(data.error);
        if (data.success) {
          toast.success(data.success);
          deleteTaskFromColumn(task.id, task.columnId);
          setActiveTask(null);
        }
      });
    });
  };

  return (
    <Form {...form}>
      <form onBlur={debouncedSave} className="space-y-3">
        {/* Save state indicator — fixed height prevents layout shift */}
        <div className="flex h-3 items-center">
          {!canEdit ? (
            <span className="text-xs text-muted-foreground">View only</span>
          ) : isPending ? (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving…
            </span>
          ) : saveState === 'saved' ? (
            <span className="flex items-center gap-1.5 text-xs text-emerald-600">
              <Check className="h-3 w-3" />
              Saved
            </span>
          ) : saveState === 'error' ? (
            <span className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertCircle className="h-3 w-3" />
              Failed to save
            </span>
          ) : null}
        </div>

        {/* Editable title — the only visible title in this dialog */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  {...field}
                  readOnly={!canEdit}
                  className="h-auto min-h-0 border-none bg-transparent p-0 text-2xl font-bold leading-tight focus-visible:ring-0 focus-visible:border-transparent rounded-md hover:bg-muted/30 transition-colors cursor-text"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Section: Details — shown before description so metadata is immediately scannable */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            Details
          </span>
          <div className="h-px flex-1 bg-border/50" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>Priority</FormLabel>
                <Select
                  onValueChange={(val) => { field.onChange(val); queueSave(); }}
                  defaultValue={field.value}
                  disabled={!canEdit}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(Priority).map((p) => (
                      <SelectItem key={p} value={p}>
                        {p.charAt(0) + p.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col space-y-1">
                <FormLabel>Due Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        disabled={!canEdit}
                        className={cn(
                          'pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ?? undefined}
                      onSelect={(date) => { field.onChange(date); queueSave(); }}
                      disabled={(date) => date < new Date('1900-01-01')}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {canEdit ? (
          <FormField
            control={form.control}
            name="needsClient"
            render={({ field }) => (
              <button
                type="button"
                onClick={() => {
                  const next = !field.value;
                  field.onChange(next);
                  toggleNeedsClient(task.id, next);
                  updateTaskInColumn({ ...task, needsClient: next });
                }}
                className={cn(
                  'flex items-center gap-2.5 w-full rounded-md px-3 py-2 text-sm transition-colors border',
                  field.value
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
                    : 'bg-transparent border-input text-muted-foreground hover:bg-muted/40'
                )}
              >
                <Clock className={cn('w-4 h-4 shrink-0', field.value ? 'text-amber-500' : 'text-muted-foreground/50')} />
                <span className="font-medium">Waiting on client</span>
                {field.value && <Check className="w-3.5 h-3.5 ml-auto text-amber-500" />}
              </button>
            )}
          />
        ) : task.needsClient ? (
          <div className="flex items-center gap-2.5 w-full rounded-md px-3 py-2 text-sm border bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400">
            <Clock className="w-4 h-4 shrink-0 text-amber-500" />
            <span className="font-medium">Waiting on client</span>
            <Check className="w-3.5 h-3.5 ml-auto text-amber-500" />
          </div>
        ) : null}

        {members.length > 0 && (
          <FormField
            control={form.control}
            name="assignee"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>Assignee</FormLabel>
                <Select
                  onValueChange={(val) => {
                    field.onChange(val === '__none__' ? null : val);
                    queueSave();
                  }}
                  value={field.value ?? '__none__'}
                  disabled={!canEdit}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="__none__">Unassigned</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.user.id} value={m.user.id}>
                        {m.user.name || m.user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  readOnly={!canEdit}
                  placeholder="Add a more detailed description..."
                  className="min-h-[80px] resize-y"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Section: Labels */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            Labels
          </span>
          <div className="h-px flex-1 bg-border/50" />
        </div>

        <LabelPicker
          labels={form.watch('labels') ?? []}
          onChange={(newLabels) => {
            form.setValue('labels', newLabels, { shouldDirty: true });
            debouncedSave();
          }}
          canEdit={canEdit}
        />

        {/* Section: Checklist */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            Checklist
          </span>
          <div className="h-px flex-1 bg-border/50" />
        </div>

        <SubtaskList task={task} canEdit={canEdit} />

        {canEdit && (
          <div className="flex justify-end pt-2">
            <ConfirmDialog
              trigger={
                <Button type="button" variant="destructive" size="sm" disabled={isPending}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Task
                </Button>
              }
              title="Delete task?"
              description={`"${task.title}" will be permanently deleted. This cannot be undone.`}
              confirmText="Delete"
              onConfirm={handleDelete}
            />
          </div>
        )}
      </form>
    </Form>
  );
}
