'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { isToday, isPast, startOfDay } from 'date-fns';
import { MessageSquare, CheckSquare } from 'lucide-react';

import { TaskWithDetails } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
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
        className={cn(
          'cursor-grab active:cursor-grabbing hover:shadow-md hover:shadow-primary/20 transition-shadow duration-200',
          isOverdue && 'border-l-4 border-l-destructive',
          isDueToday && !isOverdue && 'border-l-4 border-l-warning'
        )}
      >
        <CardHeader className="p-3 pb-1">
          <p className="font-semibold leading-tight">{task.title}</p>
          {task.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
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
        <CardContent className="p-3 pt-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <PriorityBadge priority={task.priority} />
              {task.dueDate && <DueDateBadge dueDate={task.dueDate} />}
            </div>
            {assigneeMember && (
              <UserAvatar name={assigneeMember.user.name} size="sm" />
            )}
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
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
            {task.storyPoints && (
              <div className="flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full bg-surface text-foreground">
                {task.storyPoints}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
