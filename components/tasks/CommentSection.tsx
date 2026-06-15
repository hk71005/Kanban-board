'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

import { commentSchema } from '@/lib/validations';
import { createComment } from '@/actions/comment';
import { CommentWithUser, TaskWithDetails } from '@/types';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import UserAvatar from '../shared/UserAvatar';
import { useBoardStore } from '@/store/board';

interface CommentSectionProps {
  task: TaskWithDetails;
}

export default function CommentSection({ task }: CommentSectionProps) {
  const [isPending, startTransition] = useTransition();
  const { board, currentUserId, addCommentToStore, removeCommentFromStore } = useBoardStore();

  const form = useForm<z.infer<typeof commentSchema>>({
    resolver: zodResolver(commentSchema),
    defaultValues: { content: '' },
  });

  const currentMember = board?.members.find((m) => m.user.id === currentUserId);
  const currentUser = currentMember?.user ?? {
    id: currentUserId ?? '',
    name: null,
    email: '',
  };

  const onSubmit = (values: z.infer<typeof commentSchema>) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticComment: CommentWithUser = {
      id: tempId,
      content: values.content,
      userId: currentUserId ?? '',
      taskId: task.id,
      createdAt: new Date(),
      user: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
      },
    };

    addCommentToStore(task.id, optimisticComment);
    form.reset();

    startTransition(() => {
      createComment(task.id, values).then((data) => {
        if (data.error) {
          toast.error(data.error);
          removeCommentFromStore(task.id, tempId);
        }
      });
    });
  };

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Add a comment..."
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              Comment
            </Button>
          </div>
        </form>
      </Form>

      <div className="space-y-4">
        {task.comments.map((comment) => (
          <div
            key={comment.id}
            className={comment.id.startsWith('temp-') ? 'opacity-60' : undefined}
          >
            <div className="flex items-start gap-3">
              <UserAvatar name={comment.user.name} />
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold">{comment.user.name ?? 'You'}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="p-2 mt-1 text-sm rounded-md bg-muted">{comment.content}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
