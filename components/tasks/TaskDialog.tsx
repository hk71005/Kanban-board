'use client';

import { useEffect, useRef, useState } from 'react';
import { useBoardStore } from '@/store/board';
import type { CommentWithUser } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet';
import TaskForm from './TaskForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CommentSection from './CommentSection';
import ActivityFeed from './ActivityFeed';

export default function TaskDialog() {
  const { activeTask, setActiveTask } = useBoardStore();
  const taskRef = useRef(activeTask);
  taskRef.current = activeTask;
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Close on escape key (Radix also handles this natively, kept for safety)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveTask(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTask]);

  // Lazy-load comments when a task is opened
  useEffect(() => {
    if (!activeTask) return;
    let cancelled = false;
    fetch(`/api/tasks/${activeTask.id}/comments`)
      .then((r) => (r.ok ? r.json() : []))
      .then((comments: CommentWithUser[]) => {
        if (cancelled) return;
        // taskRef.current is the latest activeTask at resolve time; skip if dialog closed
        if (!taskRef.current || taskRef.current.id !== activeTask.id) return;
        setActiveTask({ ...taskRef.current, comments });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [activeTask?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setActiveTask(null);
    }
  };

  if (!activeTask) {
    return null;
  }

  const commentsAndActivity = (
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
  );

  if (isMobile) {
    return (
      <Sheet open={!!activeTask} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" showCloseButton={false} className="p-0 rounded-t-2xl">
          <div className="flex flex-col h-[90vh] overflow-hidden">
            {/* Accessible title (visually hidden) */}
            <SheetTitle className="sr-only">{activeTask.title}</SheetTitle>
            {/* Drag handle affordance */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/25" />
            </div>
            {/* Single scrollable column: form + tabs */}
            <div className="flex-1 overflow-y-auto px-4 pt-2 pb-8">
              <TaskForm task={activeTask} />
              <div className="mt-4 pt-4 border-t">
                {commentsAndActivity}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
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
            {commentsAndActivity}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
