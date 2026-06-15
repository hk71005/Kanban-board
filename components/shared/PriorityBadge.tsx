import { Priority } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PriorityBadgeProps {
  priority: Priority;
}

const priorityMap: Record<
  Priority,
  { label: string; className: string }
> = {
  LOW: { label: 'Low', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  MEDIUM: { label: 'Medium', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  HIGH: { label: 'High', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  URGENT: { label: 'Urgent', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  const { label, className } = priorityMap[priority] || priorityMap.MEDIUM;

  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-semibold', className)}
    >
      {label}
    </Badge>
  );
}