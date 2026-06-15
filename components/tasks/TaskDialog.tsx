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
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="truncate pr-14">{activeTask.title}</DialogTitle>
        </DialogHeader>
        <div className="grid flex-1 grid-cols-1 gap-6 overflow-hidden md:grid-cols-3">
          <div className="md:col-span-2 overflow-y-auto pr-2">
            <TaskForm task={activeTask} />
          </div>
          <div className="overflow-y-auto pr-2">
            <Tabs defaultValue="comments" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="comments">Comments</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>
              <TabsContent value="comments">
                <CommentSection task={activeTask} />
              </TabsContent>
              <TabsContent value="activity">
                <ActivityFeed taskId={activeTask.id} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}