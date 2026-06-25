import { Priority } from '@prisma/client';
import { cn } from '@/lib/utils';

interface PriorityBadgeProps {
  priority: Priority;
}

const priorityConfig: Record<Priority, { label: string; bg: string; text: string }> = {
  LOW:    { label: 'Low',    bg: 'bg-blue-500/10',   text: 'text-blue-600 dark:text-blue-400' },
  MEDIUM: { label: 'Medium', bg: 'bg-amber-500/10',  text: 'text-amber-600 dark:text-amber-400' },
  HIGH:   { label: 'High',   bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400' },
  URGENT: { label: 'Urgent', bg: 'bg-red-500/10',    text: 'text-red-600 dark:text-red-400' },
};

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  const { label, bg, text } = priorityConfig[priority] ?? priorityConfig.MEDIUM;

  return (
    <span className={cn('inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full', bg, text)}>
      {label}
    </span>
  );
}
