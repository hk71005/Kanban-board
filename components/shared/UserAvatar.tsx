import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils';

interface UserAvatarProps {
  name?: string | null;
  imageUrl?: string | null;
  size?: 'sm' | 'default';
}

export default function UserAvatar({ name, imageUrl, size = 'default' }: UserAvatarProps) {
  return (
    <Avatar className={cn(size === 'sm' ? 'w-6 h-6' : 'w-8 h-8')}>
      <AvatarImage src={imageUrl || undefined} alt={name || 'User'} />
      <AvatarFallback className={cn('font-semibold', size === 'sm' ? 'text-[9px]' : 'text-xs')}>
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
