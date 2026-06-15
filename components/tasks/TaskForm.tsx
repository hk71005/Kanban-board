'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRef, useTransition } from 'react';
import { toast } from 'sonner';
import { CalendarIcon, Loader2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Priority } from '@prisma/client';

import { taskSchema } from '@/lib/validations';
import { updateTask, deleteTask } from '@/actions/task';
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
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDeletingRef = useRef(false);
  const { setActiveTask, deleteTaskFromColumn, board } = useBoardStore();
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
      labels: task.labels.map((l) => ({ name: l.name, color: l.color })),
    },
  });

  const onSubmit = (values: z.infer<typeof taskSchema>) => {
    startTransition(() => {
      updateTask(task.id, values).then((data) => {
        if (data.error) toast.error(data.error);
        if (data.success) toast.success(data.success);
      });
    });
  };

  const debouncedSave = () => {
    if (isDeletingRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (!isDeletingRef.current) form.handleSubmit(onSubmit)();
    }, 400);
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
      <form onBlur={debouncedSave} className="space-y-6">
        {isPending && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            Saving…
          </div>
        )}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  {...field}
                  className="text-lg font-semibold border-none focus-visible:ring-0 focus-visible:ring-offset-0 px-1"
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Add a more detailed description..."
                  className="min-h-[120px]"
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isPending}
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
              <FormItem className="flex flex-col">
                <FormLabel>Due Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                        disabled={isPending}
                      >
                        {field.value ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="w-4 h-4 ml-auto opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ?? undefined}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date('1900-01-01')}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="storyPoints"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Story Points</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  placeholder="e.g., 5"
                  onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                  value={field.value ?? ''}
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {members.length > 0 && (
          <FormField
            control={form.control}
            name="assignee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assignee</FormLabel>
                <Select
                  onValueChange={(val) => field.onChange(val === '__none__' ? null : val)}
                  value={field.value ?? '__none__'}
                  disabled={isPending}
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

        <LabelPicker
          labels={form.watch('labels') ?? []}
          onChange={(newLabels) => {
            form.setValue('labels', newLabels, { shouldDirty: true });
            debouncedSave();
          }}
        />

        <SubtaskList task={task} />

        <div className="flex justify-end pt-4">
          <ConfirmDialog
            trigger={
              <Button type="button" variant="destructive" disabled={isPending}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Task
              </Button>
            }
            title="Delete task?"
            description={`"${task.title}" will be permanently deleted. This cannot be undone.`}
            confirmText="Delete"
            onConfirm={handleDelete}
          />
        </div>
      </form>
    </Form>
  );
}