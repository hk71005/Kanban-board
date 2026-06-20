import {
  Kanban,
  Rocket,
  Target,
  Lightbulb,
  Zap,
  Star,
  Code2,
  Users2,
  BarChart3,
  Layers,
  Globe,
  Shield,
  Briefcase,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, LucideIcon> = {
  Kanban,
  Rocket,
  Target,
  Lightbulb,
  Zap,
  Star,
  Code2,
  Users2,
  BarChart3,
  Layers,
  Globe,
  Shield,
  Briefcase,
};

export const BOARD_ICON_OPTIONS: { name: string; icon: LucideIcon }[] = [
  { name: 'Kanban', icon: Kanban },
  { name: 'Rocket', icon: Rocket },
  { name: 'Target', icon: Target },
  { name: 'Lightbulb', icon: Lightbulb },
  { name: 'Zap', icon: Zap },
  { name: 'Star', icon: Star },
  { name: 'Code2', icon: Code2 },
  { name: 'Users2', icon: Users2 },
  { name: 'BarChart3', icon: BarChart3 },
  { name: 'Layers', icon: Layers },
  { name: 'Globe', icon: Globe },
  { name: 'Shield', icon: Shield },
  { name: 'Briefcase', icon: Briefcase },
];

interface BoardIconProps {
  emoji?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function BoardIcon({ emoji, size = 'md', className }: BoardIconProps) {
  const Icon = (emoji && ICON_MAP[emoji]) ? ICON_MAP[emoji] : Kanban;

  const containerSize = { sm: 'w-7 h-7', md: 'w-8 h-8', lg: 'w-9 h-9' }[size];
  const iconSize = { sm: 'w-3.5 h-3.5', md: 'w-4 h-4', lg: 'w-5 h-5' }[size];

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0',
        containerSize,
        className
      )}
    >
      <Icon className={iconSize} />
    </span>
  );
}
