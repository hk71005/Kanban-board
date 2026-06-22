import { Priority } from '@prisma/client';
import { cn } from '@/lib/utils';

interface PriorityBadgeProps {
  priority: Priority;
}

const priorityConfig: Record<Priority, { label: string; dot: string; text: string }> = {
  LOW:    { label: 'Low',    dot: '#60a5fa', text: 'text-muted-foreground/70' },
  MEDIUM: { label: 'Medium', dot: '#fbbf24', text: 'text-muted-foreground' },
  HIGH:   { label: 'High',   dot: '#f97316', text: 'text-muted-foreground' },
  URGENT: { label: 'Urgent', dot: '#ef4444', text: 'text-muted-foreground' },
};

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  const { label, dot, text } = priorityConfig[priority] ?? priorityConfig.MEDIUM;

  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs', text)}>
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: dot }} />
      {label}
    </span>
  );
}
