import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { auth } from '@/lib/auth';
import { Button } from '@/components/ui/button';

const KanbanLogo = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
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
);

export default async function PrivacyPage() {
  let session = null;
  try {
    session = await auth();
  } catch {
    // show page regardless
  }

  const isSignedIn = !!session?.user;

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-base tracking-tight">
            <KanbanLogo />
            <span>Kanvi</span>
          </Link>
          <nav className="flex items-center gap-3">
            {isSignedIn ? (
              <Button asChild size="sm">
                <Link href="/boards">
                  Go to boards
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Link>
              </Button>
            ) : (
              <>
                <Link href="/login" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Sign in
                </Link>
                <Button asChild size="sm">
                  <Link href="/register">
                    Get started free
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: June 2026</p>

        <div className="space-y-10 text-sm leading-relaxed text-foreground/90">

          <section>
            <h2 className="text-base font-semibold mb-3">Overview</h2>
            <p>
              Kanvi is an indie SaaS product currently in open beta. We collect only what
              is necessary to provide the service. We do not sell data, serve ads, or share your
              information with third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">What we collect</h2>
            <ul className="space-y-2 list-disc list-inside text-muted-foreground">
              <li><span className="text-foreground font-medium">Name and email address</span> — collected when you create an account, used only to identify you within the app.</li>
              <li><span className="text-foreground font-medium">Password</span> — stored as a bcrypt hash. We never store or see your plaintext password.</li>
              <li><span className="text-foreground font-medium">Board and task data</span> — everything you create inside the app (boards, columns, tasks, comments) is stored in our database and is yours. We do not read, analyse, or share it.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">Google sign-in</h2>
            <p className="text-muted-foreground">
              If you choose to sign in with Google, we receive your name and email address from Google.
              We do not receive your Google password or access any other Google account data.
              Google sign-in is optional — you can always use email and password instead.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">Cookies and sessions</h2>
            <p className="text-muted-foreground">
              We use a single session cookie to keep you signed in. It contains a signed JWT token
              that identifies your account. No tracking cookies. No third-party ad cookies.
              The session cookie expires when you sign out or after 30 days of inactivity.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">Data storage</h2>
            <p className="text-muted-foreground">
              Your data is stored in a PostgreSQL database hosted on{' '}
              <a href="https://neon.tech" className="underline hover:text-foreground">Neon</a>.
              The application is hosted on{' '}
              <a href="https://vercel.com" className="underline hover:text-foreground">Vercel</a>.
              Both providers are SOC 2 compliant. Data is stored in the United States.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">What we do not do</h2>
            <ul className="space-y-2 list-disc list-inside text-muted-foreground">
              <li>We do not sell your data.</li>
              <li>We do not use your data to train AI models.</li>
              <li>We do not serve ads.</li>
              <li>We do not use third-party analytics or tracking scripts.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">Deleting your data</h2>
            <p className="text-muted-foreground">
              You can delete your boards and tasks at any time from within the app.
              To delete your account and all associated data, email us at the address below.
              We will process deletion requests within 7 days.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">Changes to this policy</h2>
            <p className="text-muted-foreground">
              If we make material changes to this policy, we will update the date at the top of this
              page. Continued use of the service after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">Contact</h2>
            <p className="text-muted-foreground">
              Questions about this policy? Email us at{' '}
              <a href="mailto:gharikrishnan710@gmail.com" className="underline hover:text-foreground">
                gharikrishnan710@gmail.com
              </a>
            </p>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-sm tracking-tight">
            <KanbanLogo size={18} />
            Kanvi
          </Link>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          </nav>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Kanvi
          </p>
        </div>
      </footer>

    </div>
  );
}
