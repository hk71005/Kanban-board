'use client';

import { useState, useTransition } from 'react';
import { Link2, Copy, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { generateShareToken, revokeShareToken } from '@/actions/board';

interface ShareDialogProps {
  boardId: string;
  initialToken: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ShareDialog({ boardId, initialToken, open, onOpenChange }: ShareDialogProps) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(initialToken);
  const [isPending, startTransition] = useTransition();

  const shareUrl = token
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${token}`
    : null;

  const handleGenerate = () => {
    startTransition(async () => {
      const result = await generateShareToken(boardId);
      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        setToken(result.success);
        router.refresh();
        toast.success('Share link created');
      }
    });
  };

  const handleRevoke = () => {
    startTransition(async () => {
      const result = await revokeShareToken(boardId);
      if (result.error) {
        toast.error(result.error);
      } else {
        setToken(null);
        router.refresh();
        toast.success('Share link disabled');
      }
    });
  };

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied to clipboard');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            Share board
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {shareUrl ? (
            <>
              <p className="text-sm text-muted-foreground">
                Anyone with this link can view this board without signing in.
              </p>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={shareUrl}
                  className="flex-1 text-xs font-mono"
                  onFocus={(e) => e.target.select()}
                />
                <Button variant="outline" size="icon" onClick={handleCopy} title="Copy link">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex justify-between items-center pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive text-xs"
                  onClick={handleRevoke}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3 mr-1.5" />
                  )}
                  Disable link
                </Button>
                <Button size="sm" onClick={handleCopy}>
                  <Copy className="w-3 h-3 mr-1.5" />
                  Copy link
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Generate a public link so anyone can view this board without needing an account.
                They won't be able to make changes.
              </p>
              <Button
                className="w-full"
                onClick={handleGenerate}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Link2 className="w-4 h-4 mr-2" />
                )}
                Generate share link
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
