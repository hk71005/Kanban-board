'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { isToday, isPast, startOfDay } from 'date-fns';
import { MessageSquare, CheckSquare, Check, Clock } from 'lucide-react';

import { TaskWithDetails } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PriorityBadge from '../shared/PriorityBadge';
import DueDateBadge from '../shared/DueDateBadge';
import UserAvatar from '../shared/UserAvatar';
import { useBoardStore } from '@/store/board';

interface TaskCardProps {
  task: TaskWithDetails;
}

export default function TaskCard({ task }: TaskCardProps) {
  const setActiveTask = useBoardStore((state) => state.setActiveTask);
  const board = useBoardStore((state) => state.board);

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: 'Task', task },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const isOverdue =
    task.dueDate && isPast(startOfDay(new Date(task.dueDate))) && !isToday(new Date(task.dueDate));
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));
  const completedSubtasks = task.subtasks.filter((st) => st.completed).length;

  const assigneeMember = task.assignee
    ? board?.members.find((m) => m.user.id === task.assignee)
    : null;

  const accentStyle = (): React.CSSProperties => {
    if (isOverdue) return { borderLeftWidth: '4px', borderLeftStyle: 'solid', borderLeftColor: 'hsl(var(--destructive))' };
    if (isDueToday) return { borderLeftWidth: '4px', borderLeftStyle: 'solid', borderLeftColor: '#f59e0b' };
    return { borderLeftWidth: '3px', borderLeftStyle: 'solid', borderLeftColor: 'transparent' };
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="p-4 rounded-lg opacity-50 bg-card border-2 border-primary aspect-video"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => setActiveTask(task)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setActiveTask(task);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Open task: ${task.title}`}
    >
      <Card
        className="rounded-lg cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
        style={accentStyle()}
      >
        <CardHeader className="p-3 pb-1.5">
          <p className="text-sm font-semibold leading-snug">{task.title}</p>
          {task.description && (
            <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground">
              {task.description}
            </p>
          )}
          {task.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {task.labels.map((label) => (
                <Badge
                  key={label.id}
                  style={{ backgroundColor: label.color, color: '#fff' }}
                  className="text-[10px] px-1.5 py-0 h-4"
                >
                  {label.name}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>
        <CardContent className="px-3 pb-2.5 pt-0">
          {task.needsClient && (
            <div className="mb-1.5 flex flex-col gap-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
                <Clock className="w-3 h-3" />
                Waiting on client
              </span>
              {task.clientReviewedAt && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                  <Check className="w-3 h-3" />
                  Client reviewed
                </span>
              )}
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <PriorityBadge priority={task.priority} />
              {task.dueDate && <DueDateBadge dueDate={task.dueDate} />}
            </div>
            {assigneeMember && (
              <UserAvatar name={assigneeMember.user.name} size="sm" />
            )}
          </div>
          {(task.subtasks.length > 0 || task.comments.length > 0) && (
            <div className="flex items-center gap-2.5 mt-2 text-xs text-muted-foreground">
              {task.subtasks.length > 0 && (
                <span className="flex items-center gap-1">
                  <CheckSquare className="w-3 h-3" />
                  {completedSubtasks}/{task.subtasks.length}
                </span>
              )}
              {task.comments.length > 0 && (
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  {task.comments.length}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
