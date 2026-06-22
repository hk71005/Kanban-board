import { format, isPast, isToday, startOfDay } from 'date-fns';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DueDateBadgeProps {
  dueDate: Date;
}

export default function DueDateBadge({ dueDate }: DueDateBadgeProps) {
  const date = new Date(dueDate);
  const overdue = isPast(startOfDay(date)) && !isToday(date);
  const dueToday = isToday(date);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs',
        overdue && 'rounded px-1.5 py-0.5 border border-destructive/50 bg-destructive/10 text-destructive',
        dueToday && !overdue && 'rounded px-1.5 py-0.5 border border-warning/50 bg-warning/10 text-warning',
        !overdue && !dueToday && 'text-muted-foreground'
      )}
    >
      <Clock className="w-3 h-3" />
      <span>{format(date, 'MMM d')}</span>
    </span>
  );
}
