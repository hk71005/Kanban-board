'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

import { TaskWithDetails } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { updateSubtask, createSubtask, deleteSubtask } from '@/actions/task';
import { useBoardStore } from '@/store/board';

interface SubtaskListProps {
  task: TaskWithDetails;
}

export default function SubtaskList({ task }: SubtaskListProps) {
  const [isPending, startTransition] = useTransition();
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const { updateSubtaskInStore, addSubtaskToStore, deleteSubtaskFromStore } = useBoardStore();

  const handleToggle = (subtaskId: string, completed: boolean, title: string) => {
    startTransition(() => {
      updateSubtask(subtaskId, { completed, title }).then((data) => {
        if (data.error) toast.error(data.error);
        else updateSubtaskInStore(task.id, subtaskId, { completed });
      });
    });
  };

  const handleAddSubtask = () => {
    const title = newSubtaskTitle.trim();
    if (!title) return;
    setNewSubtaskTitle('');

    const tempSubtask = {
      id: `temp-${Date.now()}`,
      title,
      completed: false,
      order: task.subtasks.length,
      taskId: task.id,
    };
    addSubtaskToStore(task.id, tempSubtask);

    startTransition(() => {
      createSubtask(task.id, title).then((data) => {
        if (data.error) {
          toast.error(data.error);
          deleteSubtaskFromStore(task.id, tempSubtask.id);
        }
      });
    });
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    startTransition(() => {
      deleteSubtask(subtaskId).then((data) => {
        if (data.error) toast.error(data.error);
        else {
          deleteSubtaskFromStore(task.id, subtaskId);
          toast.success('Subtask deleted!');
        }
      });
    });
  };

  return (
    <div className="space-y-2">
      <h3 className="font-semibold">Subtasks</h3>
      <div className="space-y-2">
        {task.subtasks.map((subtask) => (
          <div key={subtask.id} className="flex items-center gap-2 group">
            <Checkbox
              id={subtask.id}
              checked={subtask.completed}
              onCheckedChange={(checked) => handleToggle(subtask.id, !!checked, subtask.title)}
              disabled={isPending || subtask.id.startsWith('temp-')}
            />
            <label
              htmlFor={subtask.id}
              className={`flex-1 text-sm ${
                subtask.completed ? 'line-through text-muted-foreground' : ''
              } ${subtask.id.startsWith('temp-') ? 'opacity-60' : ''}`}
            >
              {subtask.title}
            </label>
            {!subtask.id.startsWith('temp-') && (
              <Button
                variant="ghost"
                size="icon"
                className="invisible w-6 h-6 group-hover:visible"
                onClick={() => handleDeleteSubtask(subtask.id)}
                disabled={isPending}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 pt-2">
        <Input
          value={newSubtaskTitle}
          onChange={(e) => setNewSubtaskTitle(e.target.value)}
          placeholder="Add a new subtask"
          onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
          disabled={isPending}
        />
        <Button onClick={handleAddSubtask} disabled={isPending}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
