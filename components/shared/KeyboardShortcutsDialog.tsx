'use client';

import { useEffect, useState } from 'react';
import { Keyboard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const shortcuts = [
  { key: 'Click task', action: 'Open task detail' },
  { key: 'Esc', action: 'Close any open dialog' },
  { key: 'Enter', action: 'Submit / confirm forms' },
  { key: 'Drag task', action: 'Move between columns or reorder' },
  { key: 'Drag column', action: 'Reorder columns' },
  { key: '?', action: 'Show keyboard shortcuts' },
];

export default function KeyboardShortcutsDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 rounded-full text-muted-foreground hover:text-foreground"
          aria-label="Keyboard shortcuts"
        >
          <Keyboard className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-1 pt-2">
          {shortcuts.map(({ key, action }) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className="text-sm text-muted-foreground">{action}</span>
              <kbd className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold bg-muted text-foreground border border-border">
                {key}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
