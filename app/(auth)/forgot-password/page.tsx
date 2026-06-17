'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Mail, CheckCircle2 } from 'lucide-react';

import { requestPasswordReset } from '@/actions/password-reset';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function ForgotPasswordPage() {
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | undefined>();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await requestPasswordReset(email);
      if (result.error) {
        toast.error(result.error);
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
          {!successMessage && (
            <>
              <CardTitle className="text-2xl font-bold">Forgot password?</CardTitle>
              <CardDescription>
                Enter your email and we&apos;ll send you a reset link.
              </CardDescription>
            </>
          )}
          {successMessage && (
            <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
          )}
        </CardHeader>
        <CardContent>
          {successMessage ? (
            <div className="flex flex-col items-center text-center space-y-4 py-2">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10">
                <CheckCircle2 className="w-7 h-7 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {successMessage}
              </p>
              <p className="text-xs text-muted-foreground">
                The link expires in 1 hour. Check your spam folder if you don&apos;t see it.
              </p>
              <Link
                href="/login"
                className="mt-2 inline-flex items-center justify-center w-full rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isPending}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isPending}>
                <Mail className="w-4 h-4 mr-2" />
                {isPending ? 'Sending…' : 'Send reset link'}
              </Button>
              <div className="text-sm text-center text-muted-foreground">
                <Link href="/login" className="underline text-accent-foreground hover:text-primary">
                  Back to login
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
