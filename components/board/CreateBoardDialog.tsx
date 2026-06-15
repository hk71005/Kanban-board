'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { boardSchema } from '@/lib/validations';
import { createBoard } from '@/actions/board';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const EMOJIS = ['📋', '🚀', '🎯', '💡', '🔥', '⚡', '🌟', '🎨', '🛠️', '📊'];

interface CreateBoardDialogProps {
  /** When true, renders as a small icon-only button for use in the navbar */
  compact?: boolean;
}

export default function CreateBoardDialog({ compact = false }: CreateBoardDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof boardSchema>>({
    resolver: zodResolver(boardSchema),
    defaultValues: {
      title: '',
      emoji: '📋',
    },
  });

  const onSubmit = (values: z.infer<typeof boardSchema>) => {
    startTransition(() => {
      createBoard(values).then((data) => {
        if (data.error) {
          toast.error(data.error);
        }
        if (data.success && data.boardId) {
          toast.success(data.success);
          form.reset();
          setOpen(false);
          router.push(`/boards/${data.boardId}`);
        }
      });
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {compact ? (
          <Button variant="ghost" size="icon" aria-label="Create new board">
            <PlusCircle className="w-4 h-4" />
          </Button>
        ) : (
          <Button>
            <PlusCircle className="w-4 h-4 mr-2" />
            Create Board
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new board</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="emoji"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-2">
                      {EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => field.onChange(emoji)}
                          className={`text-2xl p-2 rounded-lg border-2 transition-all ${
                            field.value === emoji
                              ? 'border-primary scale-110'
                              : 'border-transparent hover:border-muted'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Board Title</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Project Phoenix"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending} className="w-full">
              Create Board
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
