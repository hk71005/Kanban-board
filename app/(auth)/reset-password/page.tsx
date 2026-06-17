'use client';

import { useState, useTransition, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { KeyRound } from 'lucide-react';

import { confirmPasswordReset } from '@/actions/password-reset';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [isPending, startTransition] = useTransition();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [successMessage, setSuccessMessage] = useState<string | undefined>();

  // Missing token or email — invalid link
  if (!token || !email) {
    return (
      <div
        className="flex items-center justify-center min-h-screen bg-background"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, hsl(262 84% 58% / 0.07), transparent)' }}
      >
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-5">
              <div className="flex items-center gap-2">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <rect x="2" y="3" width="5" height="4" rx="1.25" fill="#7c3aed"/>
                  <rect x="2" y="8.5" width="5" height="6.5" rx="1.25" fill="#7c3aed" fillOpacity="0.55"/>
                  <rect x="2" y="16" width="5" height="3" rx="1" fill="#7c3aed" fillOpacity="0.25"/>
                  <rect x="8.5" y="3" width="5" height="6.5" rx="1.25" fill="#7c3aed"/>
                  <rect x="8.5" y="11" width="5" height="4" rx="1.25" fill="#7c3aed" fillOpacity="0.55"/>
                  <rect x="8.5" y="16" width="5" height="3" rx="1" fill="#7c3aed" fillOpacity="0.25"/>
                  <rect x="15" y="3" width="5" height="5" rx="1.25" fill="#7c3aed" fillOpacity="0.55"/>
                  <rect x="15" y="9.5" width="5" height="4" rx="1.25" fill="#7c3aed" fillOpacity="0.25"/>
                  <rect x="15" y="15" width="5" height="3.5" rx="1" fill="#7c3aed" fillOpacity="0.12"/>
                </svg>
                <span className="text-base font-bold tracking-tight">Kanvi</span>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Invalid reset link</CardTitle>
            <CardDescription>
              This password reset link is missing required parameters.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Please request a new password reset link.
            </p>
            <Link href="/forgot-password" className="underline text-accent-foreground hover:text-primary text-sm">
              Request a new link
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(undefined);

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    startTransition(async () => {
      const result = await confirmPasswordReset(email, token, newPassword);
      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setSuccessMessage(result.success);
      }
    });
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-background"
      style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, hsl(262 84% 58% / 0.07), transparent)' }}
    >
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          {/* Brand mark */}
          <div className="flex justify-center mb-5">
            <div className="flex items-center gap-2">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect x="2" y="3" width="5" height="4" rx="1.25" fill="#7c3aed"/>
                <rect x="2" y="8.5" width="5" height="6.5" rx="1.25" fill="#7c3aed" fillOpacity="0.55"/>
                <rect x="2" y="16" width="5" height="3" rx="1" fill="#7c3aed" fillOpacity="0.25"/>
                <rect x="8.5" y="3" width="5" height="6.5" rx="1.25" fill="#7c3aed"/>
                <rect x="8.5" y="11" width="5" height="4" rx="1.25" fill="#7c3aed" fillOpacity="0.55"/>
                <rect x="8.5" y="16" width="5" height="3" rx="1" fill="#7c3aed" fillOpacity="0.25"/>
                <rect x="15" y="3" width="5" height="5" rx="1.25" fill="#7c3aed" fillOpacity="0.55"/>
                <rect x="15" y="9.5" width="5" height="4" rx="1.25" fill="#7c3aed" fillOpacity="0.25"/>
                <rect x="15" y="15" width="5" height="3.5" rx="1" fill="#7c3aed" fillOpacity="0.12"/>
              </svg>
              <span className="text-base font-bold tracking-tight">Kanvi</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Set new password</CardTitle>
          <CardDescription>
            Choose a strong password for your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {successMessage ? (
            <div className="space-y-4">
              <p className="text-sm text-center text-muted-foreground rounded-md border border-border bg-muted/40 px-4 py-3">
                {successMessage}
              </p>
              <div className="text-sm text-center text-muted-foreground">
                <Link href="/login" className="underline text-accent-foreground hover:text-primary">
                  Sign in
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="new-password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  New password
                </label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="********"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isPending}
                  required
                  minLength={8}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="confirm-password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Confirm password
                </label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="********"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isPending}
                  required
                  minLength={8}
                />
              </div>
              {error && (
                <p className="text-sm font-medium text-destructive">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={isPending}>
                <KeyRound className="w-4 h-4 mr-2" />
                {isPending ? 'Updating…' : 'Update password'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p className="text-muted-foreground text-sm">Loading...</p></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
