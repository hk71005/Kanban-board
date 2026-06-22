'use client';

import { useState, useTransition } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { updateName } from '@/actions/user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface SettingsNameFormProps {
  name: string | null;
  email: string;
}

export default function SettingsNameForm({ name, email }: SettingsNameFormProps) {
  const [nameValue, setNameValue] = useState(name ?? '');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateName(nameValue);
      if (result.error) toast.error(result.error);
      else toast.success(result.success);
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-base font-semibold mb-1">Profile</h2>
      <p className="text-sm text-muted-foreground mb-5">Update your display name.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium">
            Name
          </label>
          <Input
            id="name"
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            placeholder="Your name"
            disabled={isPending}
            maxLength={100}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">Email</label>
          <Input value={email} readOnly disabled className="bg-muted cursor-not-allowed" />
          <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
        </div>
        <Button type="submit" disabled={isPending || nameValue.trim().length < 2}>
          {isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Check className="w-4 h-4 mr-2" />
          )}
          Save changes
        </Button>
      </form>
    </div>
  );
}
