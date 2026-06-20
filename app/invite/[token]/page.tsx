import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getInvite, acceptInvite } from '@/actions/invite';

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

const KanviLogo = () => (
  <div className="flex items-center gap-2 justify-center mb-8">
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
);

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;

  const invite = await getInvite(token);

  // ── Invalid token ──────────────────────────────────────────────────────────
  if ('error' in invite && invite.error === 'invalid') {
    return (
      <Shell>
        <KanviLogo />
        <h1 className="text-xl font-semibold text-center mb-2">Invite not found</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          This invite link is invalid or has already been used.
        </p>
        <Link
          href="/"
          className="block w-full text-center text-sm font-medium text-primary hover:underline"
        >
          Go to Kanvi
        </Link>
      </Shell>
    );
  }

  // ── Expired invite ─────────────────────────────────────────────────────────
  if ('error' in invite && invite.error === 'expired') {
    return (
      <Shell>
        <KanviLogo />
        <h1 className="text-xl font-semibold text-center mb-2">Invite expired</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          This invite link has expired. Ask the board owner to send a new one — it only takes a second.
        </p>
        <Link
          href="/"
          className="block w-full text-center text-sm font-medium text-primary hover:underline"
        >
          Go to Kanvi
        </Link>
      </Shell>
    );
  }

  const { boardTitle, inviterName, email: inviteEmail, boardId } = invite;

  const session = await auth();
  const sessionEmail = session?.user?.email?.toLowerCase() ?? null;
  const inviteEmailLower = inviteEmail.toLowerCase();

  // ── Logged in, email matches → accept and redirect ─────────────────────────
  if (session?.user && sessionEmail === inviteEmailLower) {
    const result = await acceptInvite(token);
    if ('boardId' in result) {
      redirect(`/boards/${result.boardId}`);
    }
    // acceptInvite returned an error (shouldn't happen since getInvite already validated)
    return (
      <Shell>
        <KanviLogo />
        <h1 className="text-xl font-semibold text-center mb-2">Something went wrong</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          We couldn&apos;t add you to the board. Try the link again or ask the owner to re-send the invite.
        </p>
        <Link href="/boards" className="block w-full text-center text-sm font-medium text-primary hover:underline">
          Go to your boards
        </Link>
      </Shell>
    );
  }

  // ── Logged in, wrong email ─────────────────────────────────────────────────
  if (session?.user && sessionEmail !== inviteEmailLower) {
    return (
      <Shell>
        <KanviLogo />
        <BoardCard boardTitle={boardTitle} inviterName={inviterName} />
        <p className="text-sm text-muted-foreground text-center mt-4 mb-2">
          This invite was sent to{' '}
          <span className="font-medium text-foreground">{inviteEmail}</span>.
        </p>
        <p className="text-sm text-muted-foreground text-center mb-6">
          You&apos;re signed in as{' '}
          <span className="font-medium text-foreground">{session.user.email}</span>.
          Sign in with the invited address to accept.
        </p>
        <Link
          href={`/login?callbackUrl=/invite/${token}`}
          className="block w-full text-center rounded-lg bg-primary text-primary-foreground text-sm font-semibold py-2.5 hover:opacity-90 transition-opacity"
        >
          Sign in with a different account
        </Link>
      </Shell>
    );
  }

  // ── Logged out ─────────────────────────────────────────────────────────────
  return (
    <Shell>
      <KanviLogo />
      <BoardCard boardTitle={boardTitle} inviterName={inviterName} />
      <p className="text-sm text-muted-foreground text-center mt-4 mb-6">
        This invite was sent to{' '}
        <span className="font-medium text-foreground">{inviteEmail}</span>.
        Sign in or create a free account to join.
      </p>
      <div className="flex flex-col gap-3">
        <Link
          href={`/login?callbackUrl=/invite/${token}`}
          className="block w-full text-center rounded-lg bg-primary text-primary-foreground text-sm font-semibold py-2.5 hover:opacity-90 transition-opacity"
        >
          Sign in
        </Link>
        <Link
          href={`/register?invite=${token}`}
          className="block w-full text-center rounded-lg border border-input bg-background text-sm font-semibold py-2.5 hover:bg-muted transition-colors"
        >
          Create a free account
        </Link>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-background px-4"
      style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, hsl(262 84% 58% / 0.07), transparent)' }}
    >
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-sm p-8">
        {children}
      </div>
    </div>
  );
}

function BoardCard({ boardTitle, inviterName }: { boardTitle: string; inviterName: string }) {
  return (
    <div className="text-center">
      <p className="text-sm text-muted-foreground mb-1">
        <span className="font-medium text-foreground">{inviterName}</span> invited you to
      </p>
      <h1 className="text-xl font-semibold">{boardTitle}</h1>
    </div>
  );
}
