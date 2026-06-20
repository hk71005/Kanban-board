'use client';

import { useState, useTransition } from 'react';
import { subscribeToWaitlist } from '@/actions/waitlist';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function EmailCapture() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    startTransition(async () => {
      const result = await subscribeToWaitlist(email);
      if (result.error) {
        setStatus('error');
        setMessage(result.error);
      } else {
        setStatus('success');
        setMessage(result.success ?? '');
        setEmail('');
      }
    });
  };

  if (status === 'success') {
    return (
      <p className="text-sm text-emerald-500 font-medium">{message}</p>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm mx-auto">
        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isPending}
          required
          className="flex-1"
        />
        <Button type="submit" variant="outline" disabled={isPending || !email.trim()}>
          {isPending ? 'Saving…' : 'Notify me'}
        </Button>
      </form>
      {status === 'error' && (
        <p className="text-xs text-destructive mt-2">{message}</p>
      )}
    </div>
  );
}
