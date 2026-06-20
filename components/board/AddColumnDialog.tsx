'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PlusCircle } from 'lucide-react';

import { columnSchema } from '@/lib/validations';
import { createColumn } from '@/actions/board';
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

const COLORS = [
  '#7c3aed', '#f59e0b', '#3b82f6', '#22c55e', '#ef4444', '#ec4899'
];

interface AddColumnDialogProps {
  boardId: string;
}

export default function AddColumnDialog({ boardId }: AddColumnDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof columnSchema>>({
    resolver: zodResolver(columnSchema),
    defaultValues: {
      title: '',
      color: '#7c3aed',
    },
  });

  const onSubmit = (values: z.infer<typeof columnSchema>) => {
    startTransition(() => {
      createColumn(boardId, values).then((data) => {
        if (data.error) {
          toast.error(data.error);
        }
        if (data.success) {
          toast.success(data.success);
          form.reset();
          setOpen(false);
          router.refresh();
        }
      });
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <PlusCircle className="w-4 h-4 mr-2" />
          Add Column
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a new column</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Column Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., In Review" disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Column Color</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      {COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => field.onChange(color)}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            field.value === color ? 'border-primary scale-110' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color }}
                          aria-label={`Select color ${color}`}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending} className="w-full">
              Create Column
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}