'use client';

import { ChevronsUpDown } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useState } from 'react';
import CreateBoardDialog from '@/components/board/CreateBoardDialog';

type Board = {
  id: string;
  title: string;
  emoji: string | null;
};

interface BoardSelectorProps {
  boards: Board[];
}

export default function BoardSelector({ boards }: BoardSelectorProps) {
  const params = useParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const currentBoard = boards.find((board) => board.id === params.id);

  const onBoardSelect = (boardId: string) => {
    setOpen(false);
    router.push(`/boards/${boardId}`);
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select a board"
            className="w-[220px] justify-between"
          >
            <span className="truncate">
              {currentBoard
                ? `${currentBoard.emoji || '📋'} ${currentBoard.title}`
                : 'Select a board...'}
            </span>
            <ChevronsUpDown className="w-4 h-4 ml-2 opacity-50 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[220px] p-0">
          <Command>
            <CommandList>
              <CommandInput placeholder="Search boards..." />
              <CommandEmpty>No board found.</CommandEmpty>
              <CommandGroup>
                {boards.map((board) => (
                  <CommandItem
                    key={board.id}
                    onSelect={() => onBoardSelect(board.id)}
                    className="text-sm"
                  >
                    <span className="mr-2">{board.emoji || '📋'}</span>
                    <span className="truncate">{board.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
            <CommandSeparator />
          </Command>
        </PopoverContent>
      </Popover>
      <CreateBoardDialog compact />
    </div>
  );
}
