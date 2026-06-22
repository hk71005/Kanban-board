'use client';

import { useState, useTransition } from 'react';
import { Check, Eye, EyeOff, Loader2 } from 'lucide-react';
import { changePassword } from '@/actions/user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function SettingsPasswordForm() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirm) { toast.error("New passwords don't match."); return; }
    startTransition(async () => {
      const result = await changePassword(current, next, confirm);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success);
        setCurrent(''); setNext(''); setConfirm('');
      }
    });
  };

  const isValid = current.length > 0 && next.length >= 8 && confirm.length > 0;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-base font-semibold mb-1">Change Password</h2>
      <p className="text-sm text-muted-foreground mb-5">
        Choose a strong password. Minimum 8 characters.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="current-password" className="text-sm font-medium">
            Current password
          </label>
          <div className="relative">
            <Input
              id="current-password"
              type={showCurrent ? 'text' : 'password'}
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="••••••••"
              disabled={isPending}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showCurrent ? 'Hide password' : 'Show password'}
            >
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="new-password" className="text-sm font-medium">
            New password
          </label>
          <div className="relative">
            <Input
              id="new-password"
              type={showNext ? 'text' : 'password'}
              value={next}
              onChange={(e) => setNext(e.target.value)}
              placeholder="••••••••"
              disabled={isPending}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowNext((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showNext ? 'Hide password' : 'Show password'}
            >
              {showNext ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {next.length > 0 && next.length < 8 && (
            <p className="text-xs text-destructive">Must be at least 8 characters.</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirm-password" className="text-sm font-medium">
            Confirm new password
          </label>
          <Input
            id="confirm-password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            disabled={isPending}
            autoComplete="new-password"
          />
          {confirm.length > 0 && next !== confirm && (
            <p className="text-xs text-destructive">Passwords don&apos;t match.</p>
          )}
        </div>

        <Button type="submit" disabled={isPending || !isValid}>
          {isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Check className="w-4 h-4 mr-2" />
          )}
          Update password
        </Button>
      </form>
    </div>
  );
}
