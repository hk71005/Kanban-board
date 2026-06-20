import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
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

const freeTierFeatures = [
  'Unlimited boards',
  'Unlimited tasks and columns',
  'Drag-and-drop task management',
  'Due dates, priorities, and labels',
  'Subtasks and comments',
  'Team roles (Owner, Editor, Viewer)',
  'Board templates',
  'Google sign-in',
];

const proTierFeatures = [
  'Everything in Free',
  'Unlimited board members',
  'Advanced permission controls',
  'Export boards (CSV)',
  'GitHub and Slack integrations',
  'Priority support',
  'Custom branding',
];

export default async function PricingPage() {
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
                <Link
                  href="/login"
                  className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
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

      {/* Hero */}
      <section className="pt-20 pb-16 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Simple pricing.<br />No surprises.
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Start free during our open beta. All core features are included at no cost.
            A Pro plan is coming for teams that need more.
          </p>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="pb-24 px-4">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">

          {/* Free tier */}
          <div className="rounded-2xl border-2 border-primary bg-card p-8 flex flex-col relative">
            <div className="absolute -top-3.5 left-6">
              <span className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                Current plan
              </span>
            </div>
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-1">Free</h2>
              <p className="text-muted-foreground text-sm">Everything you need to get started.</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-muted-foreground text-sm ml-2">/ month</span>
              <p className="text-xs text-muted-foreground mt-1">Free forever on this plan. No credit card.</p>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {freeTierFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            {isSignedIn ? (
              <Button asChild className="w-full">
                <Link href="/boards">Go to your boards</Link>
              </Button>
            ) : (
              <Button asChild className="w-full">
                <Link href="/register">
                  Get started free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            )}
          </div>

          {/* Pro tier */}
          <div className="rounded-2xl border border-border bg-card p-8 flex flex-col">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold">Pro</h2>
                <span className="text-xs font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                  Coming soon
                </span>
              </div>
              <p className="text-muted-foreground text-sm">For teams that need more power.</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold">$6</span>
              <span className="text-muted-foreground text-sm ml-2">/ month</span>
              <p className="text-xs text-muted-foreground mt-1">Per workspace. Billed monthly.</p>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {proTierFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-muted-foreground/50 shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" className="w-full">
              <Link href="/register">
                Join free — get notified at launch
              </Link>
            </Button>
          </div>

        </div>

        {/* FAQ / reassurance */}
        <div className="max-w-2xl mx-auto mt-14 text-center space-y-4">
          <h3 className="text-lg font-semibold">Frequently asked questions</h3>
          <div className="grid sm:grid-cols-2 gap-4 text-left mt-6">
            {[
              {
                q: 'Is the free plan really free?',
                a: 'Yes. No credit card, no trial period, no dark patterns. Free means free.',
              },
              {
                q: 'What happens after the beta?',
                a: 'The Free plan stays free. Pro features will be available for $6/month when ready — you will be notified first.',
              },
              {
                q: 'How many boards can I create?',
                a: 'Unlimited boards, unlimited tasks, unlimited columns — on the free plan.',
              },
              {
                q: 'Can I invite my team for free?',
                a: 'Yes. Invite team members and assign roles on any board at no cost.',
              },
            ].map(({ q, a }) => (
              <div key={q} className="rounded-xl border border-border bg-card p-5">
                <p className="text-sm font-semibold mb-1.5">{q}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          </nav>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Kanvi
          </p>
        </div>
      </footer>

    </div>
  );
}
