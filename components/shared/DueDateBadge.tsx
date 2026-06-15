import { format, isPast, isToday, startOfDay } from 'date-fns';
import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DueDateBadgeProps {
  dueDate: Date;
}

export default function DueDateBadge({ dueDate }: DueDateBadgeProps) {
  const date = new Date(dueDate);
  const overdue = isPast(startOfDay(date)) && !isToday(date);
  const dueToday = isToday(date);

  return (
    <Badge
      variant="outline"
      className={cn(
        'flex items-center gap-1 text-xs font-normal',
        overdue && 'border-destructive/50 bg-destructive/10 text-destructive',
        dueToday && !overdue && 'border-warning/50 bg-warning/10 text-warning',
        !overdue && !dueToday && 'text-muted-foreground'
      )}
    >
      <Clock className="w-3 h-3" />
      <span>{format(date, 'MMM d')}</span>
    </Badge>
  );
}
