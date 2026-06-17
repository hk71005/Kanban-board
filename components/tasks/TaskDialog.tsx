'use client';

import { useEffect } from 'react';
import { useBoardStore } from '@/store/board';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import TaskForm from './TaskForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CommentSection from './CommentSection';
import ActivityFeed from './ActivityFeed';

export default function TaskDialog() {
  const { activeTask, setActiveTask } = useBoardStore();

  // Close dialog on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveTask(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTask]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setActiveTask(null);
    }
  };

  if (!activeTask) {
    return null;
  }

  return (
    <Dialog open={!!activeTask} onOpenChange={handleOpenChange}>
      {/*
        sm:max-w-4xl overrides the component's default sm:max-w-sm (384px) so
        the dialog is actually wide on desktop. flex flex-col overrides the
        component's default `grid` display so children stack vertically and
        flex-1 on the inner grid works correctly.
      */}
      <DialogContent className="sm:max-w-4xl h-[85vh] flex flex-col">
        <DialogHeader>
          {/* sr-only: provides accessible dialog label without duplicating the
              editable title Input rendered at the top of TaskForm. */}
          <DialogTitle className="sr-only">{activeTask.title}</DialogTitle>
        </DialogHeader>

        <div className="grid flex-1 min-h-0 grid-cols-1 gap-6 overflow-hidden md:grid-cols-[3fr_2fr]">
          {/* Left: task form — scrolls independently */}
          <div className="min-h-0 overflow-y-auto pr-1">
            <TaskForm task={activeTask} />
          </div>

          {/* Right: comments / activity — flex column so Tabs fills height */}
          <div className="flex min-h-0 flex-col border-l pl-4">
            <Tabs defaultValue="comments" className="flex min-h-0 flex-1 flex-col w-full">
              <TabsList className="grid w-full grid-cols-2 shrink-0">
                <TabsTrigger value="comments">Comments</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>
              <TabsContent value="comments" className="mt-3 min-h-0 flex-1 overflow-y-auto">
                <CommentSection task={activeTask} />
              </TabsContent>
              <TabsContent value="activity" className="mt-3 min-h-0 flex-1 overflow-y-auto">
                <ActivityFeed taskId={activeTask.id} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
