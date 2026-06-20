'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { boardSchema } from '@/lib/validations';
import { createBoardWithTemplate } from '@/actions/board';
import { BOARD_TEMPLATES } from '@/lib/templates';
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
import BoardIcon, { BOARD_ICON_OPTIONS } from '@/components/shared/BoardIcon';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface CreateBoardDialogProps {
  /** When true, renders as a small icon-only button for use in the navbar */
  compact?: boolean;
}

const DEFAULT_TEMPLATE_ID = 'sprint';
const defaultTemplate = BOARD_TEMPLATES.find((t) => t.id === DEFAULT_TEMPLATE_ID)!;

export default function CreateBoardDialog({ compact = false }: CreateBoardDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [selectedTemplateId, setSelectedTemplateId] = useState(DEFAULT_TEMPLATE_ID);

  const form = useForm<z.infer<typeof boardSchema>>({
    resolver: zodResolver(boardSchema),
    defaultValues: {
      title: '',
      emoji: defaultTemplate.icon,
    },
  });

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = BOARD_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      form.setValue('emoji', template.icon);
    }
  };

  const resetDialog = () => {
    form.reset({ title: '', emoji: defaultTemplate.icon });
    setSelectedTemplateId(DEFAULT_TEMPLATE_ID);
  };

  const onSubmit = (values: z.infer<typeof boardSchema>) => {
    const template = BOARD_TEMPLATES.find((t) => t.id === selectedTemplateId);
    const columns = template?.columns ?? [];

    startTransition(() => {
      createBoardWithTemplate(values, columns).then((data) => {
        if (data.error) {
          toast.error(data.error);
        }
        if (data.success && data.boardId) {
          toast.success(data.success);
          resetDialog();
          setOpen(false);
          router.push(`/boards/${data.boardId}`);
        }
      });
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetDialog();
      }}
    >
      {compact ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Create new board">
                <PlusCircle className="w-4 h-4" />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">Create new board</TooltipContent>
        </Tooltip>
      ) : (
        <DialogTrigger asChild>
          <Button>
            <PlusCircle className="w-4 h-4 mr-2" />
            Create Board
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a new board</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

            {/* Template selection */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Start from a template</p>
              <div className="grid grid-cols-2 gap-2">
                {BOARD_TEMPLATES.map((template) => {
                  const isSelected = selectedTemplateId === template.id;
                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => handleTemplateSelect(template.id)}
                      className={cn(
                        'flex flex-col items-start gap-1.5 rounded-lg border-2 p-3 text-left transition-all',
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-muted-foreground/40 hover:bg-muted/30'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <BoardIcon emoji={template.icon} size="sm" />
                        <span className="text-xs font-semibold leading-tight">
                          {template.name}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-snug">
                        {template.description}
                      </p>
                      {template.columns.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {template.columns.map((col) => (
                            <span
                              key={col.title}
                              className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground"
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: col.color }}
                              />
                              {col.title}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[9px] text-muted-foreground/50 mt-0.5">
                          No columns — build from scratch
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Icon picker */}
            <FormField
              control={form.control}
              name="emoji"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-2">
                      {BOARD_ICON_OPTIONS.map(({ name, icon: Icon }) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => field.onChange(name)}
                          className={cn(
                            'flex items-center justify-center w-10 h-10 rounded-lg border-2 transition-all',
                            field.value === name
                              ? 'border-primary bg-primary/10'
                              : 'border-transparent hover:border-muted bg-muted/30 hover:bg-muted/50'
                          )}
                        >
                          <Icon
                            className={cn(
                              'w-5 h-5',
                              field.value === name ? 'text-primary' : 'text-muted-foreground'
                            )}
                          />
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Title input */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Give your board a name</FormLabel>
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
