import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import UserAvatar from '@/components/shared/UserAvatar';
import { BoardMemberWithUser } from '@/types';

interface MemberAvatarsProps {
  members: BoardMemberWithUser[];
  maxToShow?: number;
}

export default function MemberAvatars({
  members,
  maxToShow = 3,
}: MemberAvatarsProps) {
  const visibleMembers = members.slice(0, maxToShow);
  const hiddenMembersCount = members.length - maxToShow;

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex items-center -space-x-2">
        {visibleMembers.map((member) => (
          <Tooltip key={member.id}>
            <TooltipTrigger asChild>
              <div className="transition-transform duration-200 ease-in-out rounded-full cursor-pointer hover:-translate-y-1">
                <UserAvatar name={member.user.name} />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{member.user.name || member.user.email}</p>
            </TooltipContent>
          </Tooltip>
        ))}
        {hiddenMembersCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center w-8 h-8 text-xs font-semibold border-2 rounded-full cursor-pointer bg-muted border-background text-muted-foreground">
                +{hiddenMembersCount}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{hiddenMembersCount} more member(s)</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}