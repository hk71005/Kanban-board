'use client';

import { Filter } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { BoardMemberWithUser } from '@/types';
import { Priority } from '@prisma/client';
import { useBoardStore } from '@/store/board';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  members: BoardMemberWithUser[];
}

export default function FilterBar({ members }: FilterBarProps) {
  const { priorityFilters, setPriorityFilters, assigneeFilter, setAssigneeFilter } = useBoardStore();

  const togglePriority = (priority: Priority) => {
    setPriorityFilters(
      priorityFilters.includes(priority)
        ? priorityFilters.filter((p) => p !== priority)
        : [...priorityFilters, priority]
    );
  };

  const isActive = priorityFilters.length > 0 || !!assigneeFilter;

  const clearAll = () => {
    setPriorityFilters([]);
    setAssigneeFilter(null);
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={cn(isActive && 'border-primary text-primary')}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filter
            {isActive && (
              <span className="ml-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold rounded-full bg-primary text-primary-foreground">
                {priorityFilters.length + (assigneeFilter ? 1 : 0)}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {Object.values(Priority).map((p) => (
            <DropdownMenuCheckboxItem
              key={p}
              checked={priorityFilters.includes(p)}
              onCheckedChange={() => togglePriority(p)}
            >
              {p.charAt(0) + p.slice(1).toLowerCase()}
            </DropdownMenuCheckboxItem>
          ))}

          {members.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Filter by Assignee</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {members.map((member) => (
                <DropdownMenuCheckboxItem
                  key={member.userId}
                  checked={assigneeFilter === member.user.id}
                  onCheckedChange={() =>
                    setAssigneeFilter(
                      assigneeFilter === member.user.id ? null : member.user.id
                    )
                  }
                >
                  {member.user.name || member.user.email}
                </DropdownMenuCheckboxItem>
              ))}
            </>
          )}

          {isActive && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={false}
                onCheckedChange={clearAll}
                className="text-muted-foreground"
              >
                Clear filters
              </DropdownMenuCheckboxItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}