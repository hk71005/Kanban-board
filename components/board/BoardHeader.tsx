'use client';

import { useState, useTransition } from 'react';
import { Plus, MoreHorizontal, CalendarIcon, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Priority } from '@prisma/client';
import { useRouter } from 'next/navigation';

import { BoardWithDetails } from '@/types';
import dynamic from 'next/dynamic';
const MemberManagementDialog = dynamic(() => import('./MemberManagementDialog'), { ssr: false });
import ProgressBar from './ProgressBar';
import { Button } from '../ui/button';
import SearchBar from '../filters/SearchBar';
import FilterBar from '../filters/FilterBar';
import { useBoardStore } from '@/store/board';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { createTask } from '@/actions/task';
import { updateBoard, deleteBoard } from '@/actions/board';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

interface BoardHeaderProps {
  board: BoardWithDetails;
  currentUserId: string;
}

export default function BoardHeader({ board, currentUserId }: BoardHeaderProps) {
  const router = useRouter();

  // New Task dialog state
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const [assignee, setAssignee] = useState<string>('__none__');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [dueDateOpen, setDueDateOpen] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState(board.columns[0]?.id ?? '');

  // Edit board dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(board.title);
  const [editEmoji, setEditEmoji] = useState(board.emoji ?? '');

  const [isPending, startTransition] = useTransition();
  const columns = useBoardStore((s) => s.columns);
  const members = useBoardStore((s) => s.board?.members ?? []);
  const { addTaskToColumn, deleteTaskFromColumn } = useBoardStore();

  const isOwner = board.user.id === currentUserId;

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority(Priority.MEDIUM);
    setAssignee('__none__');
    setDueDate(undefined);
    setSelectedColumnId(columns[0]?.id ?? board.columns[0]?.id ?? '');
  };

  const handleCreate = () => {
    if (!title.trim() || !selectedColumnId) return;
    const t = title.trim();
    const colId = selectedColumnId;
    const colTitle = (columns.length > 0 ? columns : board.columns).find(
      (c) => c.id === colId
    )?.title ?? '';

    setOpen(false);
    resetForm();

    const tempId = `temp-${Date.now()}`;
    addTaskToColumn({
      id: tempId,
      title: t,
      description: description.trim() || null,
      priority,
      columnId: colId,
      order: (columns.find((c) => c.id === colId)?.tasks.length ?? 0),
      dueDate: dueDate ?? null,
      assignee: assignee === '__none__' ? null : assignee,
      storyPoints: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      labels: [],
      subtasks: [],
      comments: [],
      column: { title: colTitle },
    });

    startTransition(() => {
      createTask(colId, {
        title: t,
        description: description.trim() || undefined,
        priority,
        assignee: assignee === '__none__' ? null : assignee,
        dueDate: dueDate ?? null,
      }).then((data) => {
        if (data.error) {
          toast.error(data.error);
          deleteTaskFromColumn(tempId, colId);
        }
      });
    });
  };

  const handleEditBoard = () => {
    const t = editTitle.trim();
    if (!t) return;
    setEditOpen(false);
    startTransition(() => {
      updateBoard(board.id, { title: t, emoji: editEmoji || undefined }).then((data) => {
        if (data.error) toast.error(data.error);
        else { toast.success('Board updated'); router.refresh(); }
      });
    });
  };

  const handleDeleteBoard = () => {
    startTransition(() => {
      deleteBoard(board.id).then((data) => {
        if (data.error) toast.error(data.error);
        else { toast.success('Board deleted'); router.push('/boards'); }
      });
    });
  };

  return (
    <div className="p-4 border-b bg-surface">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Board identity */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-3xl shrink-0">{board.emoji || '📋'}</span>
          <h1 className="text-2xl font-bold truncate">{board.title}</h1>
          <MemberManagementDialog board={board} currentUserId={currentUserId} />
        </div>

        {/* Actions row */}
        <div className="flex items-center gap-2 flex-wrap">
          <SearchBar />

          {/* New Task dialog */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create a new task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Task Title</p>
                  <Input
                    autoFocus
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Design homepage mockup"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Description</p>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a more detailed description..."
                    className="min-h-[80px]"
                    disabled={isPending}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Priority</p>
                    <Select
                      value={priority}
                      onValueChange={(v) => setPriority(v as Priority)}
                      disabled={isPending}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(Priority).map((p) => (
                          <SelectItem key={p} value={p}>
                            {p.charAt(0) + p.slice(1).toLowerCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Due Date</p>
                    <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !dueDate && 'text-muted-foreground'
                          )}
                          disabled={isPending}
                        >
                          {dueDate ? format(dueDate, 'PPP') : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto w-4 h-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dueDate}
                          onSelect={(d) => {
                            setDueDate(d);
                            setDueDateOpen(false);
                          }}
                          disabled={(date) => date < new Date('1900-01-01')}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Column</p>
                  <Select value={selectedColumnId} onValueChange={setSelectedColumnId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a column" />
                    </SelectTrigger>
                    <SelectContent>
                      {(columns.length > 0 ? columns : board.columns).map((col) => (
                        <SelectItem key={col.id} value={col.id}>
                          <span className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full inline-block"
                              style={{ backgroundColor: col.color }}
                            />
                            {col.title}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {members.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Assignee</p>
                    <Select
                      value={assignee}
                      onValueChange={setAssignee}
                      disabled={isPending}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Unassigned</SelectItem>
                        {members.map((m) => (
                          <SelectItem key={m.user.id} value={m.user.id}>
                            {m.user.name || m.user.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button
                  className="w-full"
                  onClick={handleCreate}
                  disabled={isPending || !title.trim()}
                >
                  Create Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Board options menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Board options">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isOwner && (
                <>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      setEditTitle(board.title);
                      setEditEmoji(board.emoji ?? '');
                      setEditOpen(true);
                    }}
                    className="cursor-pointer"
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit board
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <ConfirmDialog
                    trigger={
                      <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        className="text-destructive focus:text-destructive cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete board
                      </DropdownMenuItem>
                    }
                    title="Delete board?"
                    description={`Permanently delete "${board.title}" and all its columns and tasks? This cannot be undone.`}
                    confirmText="Delete"
                    onConfirm={handleDeleteBoard}
                  />
                </>
              )}
              {!isOwner && (
                <DropdownMenuItem disabled className="text-muted-foreground text-xs">
                  Only the board owner can edit
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Edit board dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit board</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <p className="text-sm font-medium">Emoji</p>
              <Input
                value={editEmoji}
                onChange={(e) => setEditEmoji(e.target.value)}
                placeholder="📋"
                maxLength={2}
              />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Title</p>
              <Input
                autoFocus
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Board title..."
                onKeyDown={(e) => e.key === 'Enter' && handleEditBoard()}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleEditBoard}
              disabled={isPending || !editTitle.trim()}
            >
              Save changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Filter bar + progress — stacked on mobile */}
      <div className="flex flex-col gap-3 mt-4 md:flex-row md:items-center md:justify-between">
        <FilterBar members={board.members} />
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">Progress</span>
          <ProgressBar />
        </div>
      </div>
    </div>
  );
}
