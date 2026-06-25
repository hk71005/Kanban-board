import { Priority } from '@prisma/client';
import { cn } from '@/lib/utils';

interface PriorityBadgeProps {
  priority: Priority;
}

const priorityConfig: Record<Priority, { label: string; cls: string }> = {
  LOW:    { label: 'Low',    cls: 'bg-blue-50   text-blue-600   border-blue-200   dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30' },
  MEDIUM: { label: 'Medium', cls: 'bg-amber-50  text-amber-600  border-amber-200  dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30' },
  HIGH:   { label: 'High',   cls: 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/30' },
  URGENT: { label: 'Urgent', cls: 'bg-red-50    text-red-600    border-red-200    dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30' },
};

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  const { label, cls } = priorityConfig[priority] ?? priorityConfig.MEDIUM;

  return (
    <span className={cn('inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border', cls)}>
      {label}
    </span>
  );
}
