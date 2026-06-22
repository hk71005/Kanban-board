import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import db from '@/lib/db';
import type { Metadata } from 'next';
import SettingsNameForm from '@/components/settings/SettingsNameForm';
import SettingsPasswordForm from '@/components/settings/SettingsPasswordForm';

export const metadata: Metadata = { title: 'Settings | Kanvi' };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, createdAt: true },
  });

  if (!user) redirect('/login');

  return (
    <div className="container max-w-2xl py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account information.</p>
      </div>

      <div className="space-y-6">
        {/* Profile */}
        <SettingsNameForm name={user.name} email={user.email} />

        {/* Password */}
        <SettingsPasswordForm />

        {/* Account info */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-base font-semibold mb-1">Account</h2>
          <p className="text-sm text-muted-foreground mb-4">Read-only account details.</p>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium truncate">{user.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Member since</dt>
              <dd className="font-medium">
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
