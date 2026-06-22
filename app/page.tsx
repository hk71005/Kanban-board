import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ArrowRight,
  BarChart3,
  Check,
  CheckSquare,
  Clock,
  Columns3,
  MessageSquare,
  Minus,
  Shield,
  Users,
  X,
  Zap,
} from 'lucide-react';

import { auth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import EmailCapture from '@/components/landing/EmailCapture';
import { testimonials } from '@/lib/testimonials';
import type { Testimonial } from '@/lib/testimonials';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://kanvi.app',
  },
};

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

const BrowserChrome = ({ label }: { label: string }) => (
  <div className="flex items-center gap-3 px-4 h-9 bg-surface border-b border-border shrink-0">
    <div className="flex gap-1.5">
      <span className="w-2.5 h-2.5 rounded-full bg-red-400/50" />
      <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/50" />
      <span className="w-2.5 h-2.5 rounded-full bg-green-400/50" />
    </div>
    <span className="flex-1 text-[10px] text-muted-foreground/50 text-center font-mono truncate">
      {label}
    </span>
  </div>
);

const PriorityDot = ({ color }: { color: string }) => (
  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
);

const MockTaskCard = ({
  title,
  priorityColor,
  priorityLabel,
  accent,
}: {
  title: string;
  priorityColor: string;
  priorityLabel: string;
  accent?: boolean;
}) => (
  <div
    className={`bg-card rounded-md p-2.5 border border-border shadow-sm${accent ? ' border-l-[3px] border-l-orange-400' : ''}`}
  >
    <p className="text-[11px] font-semibold leading-snug mb-1.5">{title}</p>
    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
      <PriorityDot color={priorityColor} />
      {priorityLabel}
    </span>
  </div>
);

const MockColumn = ({
  title,
  dotColor,
  count,
  children,
}: {
  title: string;
  dotColor: string;
  count: number;
  children: React.ReactNode;
}) => (
  <div className="flex-1 min-w-[148px] rounded-lg bg-surface p-2">
    <div className="flex items-center gap-1.5 px-1.5 py-1 mb-2">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
      <span className="text-[11px] font-semibold truncate">{title}</span>
      <span className="ml-auto text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full shrink-0">
        {count}
      </span>
    </div>
    <div className="flex flex-col gap-2">{children}</div>
  </div>
);


export default async function HomePage() {
  let session = null;
  try {
    session = await auth();
  } catch {
    // If auth check fails, show the landing page rather than crashing
  }

  if (session?.user) {
    redirect('/boards');
  }

  const features = [
    {
      icon: <Columns3 className="w-4 h-4" />,
      title: 'Drag-and-drop',
      desc: 'Move tasks between columns and reorder them within a column with smooth, responsive drag-and-drop.',
    },
    {
      icon: <Zap className="w-4 h-4" />,
      title: 'Priority & labels',
      desc: 'Mark tasks as Low, Medium, High, or Urgent. Add custom labels to group related work visually.',
    },
    {
      icon: <Clock className="w-4 h-4" />,
      title: 'Due dates',
      desc: 'Set deadlines on any task. Overdue items are highlighted automatically — no manual checking needed.',
    },
    {
      icon: <Users className="w-4 h-4" />,
      title: 'Client access',
      desc: 'Share a read-only board link with any client — no account needed. Invite collaborators as Editors or Viewers and control who can change what.',
    },
    {
      icon: <MessageSquare className="w-4 h-4" />,
      title: 'Comments & activity',
      desc: 'Discuss work directly on tasks. Every change is logged in a full activity feed on each task.',
    },
    {
      icon: <CheckSquare className="w-4 h-4" />,
      title: 'Subtasks',
      desc: 'Break large tasks into smaller steps. Track completion with a visual checklist on every card.',
    },
  ];

  const whyPoints = [
    {
      icon: <Zap className="w-4 h-4" />,
      text: 'Create your first board in under 30 seconds. No setup wizard, no onboarding survey.',
    },
    {
      icon: <Shield className="w-4 h-4" />,
      text: 'No credit card required. No trial period that expires. No dark patterns.',
    },
    {
      icon: <Users className="w-4 h-4" />,
      text: 'Share your board with any client in one click — no account, no login, no friction.',
    },
    {
      icon: <BarChart3 className="w-4 h-4" />,
      text: 'Every feature that ships is one you will actually use. No feature graveyard.',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Kanvi',
            applicationCategory: 'ProjectManagementApplication',
            operatingSystem: 'Web',
            description: 'Client project workspace for freelancers.',
            url: 'https://kanvi.app',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
            },
          }),
        }}
      />

      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-base tracking-tight">
            <KanbanLogo />
            <span>Kanvi</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link
              href="/pricing"
              className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
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
          </nav>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        className="relative pt-20 pb-16 md:pt-28 md:pb-24 px-4 text-center"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 0%, hsl(262 84% 58% / 0.08), transparent)',
        }}
      >
        <div className="max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 text-xs font-medium rounded-full border border-primary/30 bg-primary/5 text-primary">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Open beta — free to join
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-[3.5rem] font-bold tracking-tight leading-tight mb-6">
            The Kanban board built for
            <br />
            <span className="text-primary">freelancers and their clients.</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            One board per client. Share live progress with a link — no client login needed.
            Unlimited projects, no per-seat fees. Start in 30 seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
            <Button asChild size="lg" className="w-full sm:w-auto text-base px-8">
              <Link href="/register">
                Get started free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto text-base px-8"
            >
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-12">
            Built for freelancers and consultants. Not enterprise software.
          </p>

          {/* ── Board mockup ─────────────────────────────────────────────── */}
          <div className="rounded-xl border border-border shadow-2xl shadow-primary/10 overflow-hidden bg-background max-w-4xl mx-auto">
            <BrowserChrome label="kanvi.app/boards/project-alpha" />
            <div className="flex gap-3 p-4 overflow-x-auto">
              <MockColumn title="To Do" dotColor="#60a5fa" count={2}>
                <MockTaskCard title="Q3 marketing campaign" priorityColor="#fbbf24" priorityLabel="Medium" />
                <MockTaskCard title="Review landing page copy" priorityColor="#60a5fa" priorityLabel="Low" />
              </MockColumn>
              <MockColumn title="In Progress" dotColor="#fbbf24" count={2}>
                <MockTaskCard title="Update client proposal" priorityColor="#f97316" priorityLabel="High" accent />
                <MockTaskCard title="Prepare client proposal" priorityColor="#fbbf24" priorityLabel="Medium" />
              </MockColumn>
              <MockColumn title="Review" dotColor="#a78bfa" count={1}>
                <div className="bg-card rounded-md p-2.5 border border-border shadow-sm">
                  <p className="text-[11px] font-semibold leading-snug mb-1.5">Onboard new hire</p>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                      <PriorityDot color="#f97316" />High
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <MessageSquare className="w-2.5 h-2.5" />3
                    </span>
                  </div>
                </div>
              </MockColumn>
              <MockColumn title="Done" dotColor="#4ade80" count={2}>
                <MockTaskCard title="Ship v2.0 release" priorityColor="#ef4444" priorityLabel="Urgent" />
                <MockTaskCard title="Write weekly report" priorityColor="#fbbf24" priorityLabel="Medium" />
              </MockColumn>
            </div>
          </div>
        </div>
      </section>

      {/* ── Value props ──────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Everything you need to manage client work
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Three things that actually matter in a project tool — and nothing that doesn't.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Columns3 className="w-5 h-5 text-primary" />,
                title: 'Organize',
                desc: 'Create boards and columns that match your exact workflow. Drag tasks between columns as work progresses.',
              },
              {
                icon: <Users className="w-5 h-5 text-primary" />,
                title: 'Collaborate',
                desc: 'Share a live board link with any client — no login required. Invite collaborators as editors and keep every conversation on the task itself.',
              },
              {
                icon: <BarChart3 className="w-5 h-5 text-primary" />,
                title: 'Track',
                desc: "See live progress across your board. Know what's done, what's stuck, and what needs attention.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-border bg-card p-6"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Core features ────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-surface/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Everything is built in</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              No plugins. No paid add-ons. No integrations required. The features you need
              are already there.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border bg-card p-5 flex gap-4"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1.5">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why choose ───────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Copy */}
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 leading-snug">
                Built for people who want to focus, not configure
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                Most project tools make you spend the first week setting them up. Kanvi
                gets out of the way so you can spend that time actually shipping.
              </p>
              <ul className="space-y-4">
                {whyPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      {point.icon}
                    </span>
                    <span className="text-muted-foreground leading-snug pt-1">{point.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Task detail mockup */}
            <div className="rounded-xl border border-border overflow-hidden shadow-xl shadow-primary/5">
              <BrowserChrome label="Task details" />
              <div className="bg-background p-5">
                <p className="text-sm font-semibold mb-4">Prepare Q3 client proposal</p>
                <div className="flex gap-6 mb-5">
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground mb-1">PRIORITY</p>
                    <span className="inline-flex items-center gap-1 text-xs">
                      <PriorityDot color="#f97316" />High
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground mb-1">DUE DATE</p>
                    <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                      <Clock className="w-3 h-3" />Due today
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground mb-1">ASSIGNEE</p>
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                      JD
                    </span>
                  </div>
                </div>
                <div className="mb-5">
                  <p className="text-[10px] font-medium text-muted-foreground mb-2">SUBTASKS</p>
                  <div className="space-y-2">
                    {[
                      { label: 'Gather competitor analysis', done: true },
                      { label: 'Draft executive summary', done: true },
                      { label: 'Client final review', done: false },
                    ].map((sub) => (
                      <div key={sub.label} className="flex items-center gap-2 text-xs">
                        <span
                          className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                            sub.done
                              ? 'bg-primary border-primary'
                              : 'border-muted-foreground/30'
                          }`}
                        >
                          {sub.done && (
                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                              <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </span>
                        <span className={sub.done ? 'line-through text-muted-foreground' : ''}>
                          {sub.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t border-border pt-4">
                  <p className="text-[10px] font-medium text-muted-foreground mb-2.5">COMMENTS</p>
                  <div className="flex gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-violet-500 text-white text-[9px] font-bold shrink-0">
                      AK
                    </span>
                    <div className="bg-muted rounded-lg px-3 py-2 text-[10px] text-muted-foreground leading-snug">
                      Can we push the client deadline to Friday? They need two more days to review.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Founder Story ────────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-surface/40">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-lg mb-5">
            H
          </div>
          <blockquote className="text-lg text-foreground leading-relaxed mb-5">
            "I built Kanvi because I was managing multiple client projects and kept hitting
            paywalls and bloated workflows. I wanted something fast enough for a solo
            freelancer, professional enough to share directly with clients — so I built it."
          </blockquote>
          <p className="text-sm text-muted-foreground font-medium">
            Hari · Founder
          </p>
        </div>
      </section>

      {/* ── Early Access + Community ─────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">

          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-5 text-xs font-medium rounded-full border border-primary/30 bg-primary/5 text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Open beta
            </div>
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Built with early users, not just for them
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Kanvi is shaped by freelancers and consultants who needed to track client
              work without the overhead of enterprise project tools.
            </p>
          </div>

          {/* Trust blocks */}
          <div className="grid md:grid-cols-3 gap-5 mb-12">
            {[
              {
                icon: <Users className="w-5 h-5 text-primary" />,
                title: 'Made for your kind of work',
                desc: 'Freelancers managing multiple clients. Consultants who need one board per project. Anyone tired of paying per-seat fees just to give a client visibility.',
              },
              {
                icon: <MessageSquare className="w-5 h-5 text-primary" />,
                title: 'Your feedback ships features',
                desc: 'Every feature in Kanvi came from a real frustration someone shared. Early users who speak up directly shape what gets built next.',
              },
              {
                icon: <Zap className="w-5 h-5 text-primary" />,
                title: 'A direct line to the founder',
                desc: "You'll hear from Hari — the person who built Kanvi — not a support queue. Replies to your welcome email go straight to him.",
              },
            ].map((card) => (
              <div key={card.title} className="rounded-xl border border-border bg-card p-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  {card.icon}
                </div>
                <h3 className="font-semibold mb-2">{card.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>

          {/* Testimonials — only rendered when the array is populated */}
          {testimonials.length > 0 && (
            <div className="mb-12">
              <h3 className="text-xl font-semibold text-center mb-8">What people are saying</h3>
              <div className={`grid gap-5 ${
                testimonials.length === 1
                  ? 'max-w-sm mx-auto'
                  : testimonials.length === 2
                  ? 'sm:grid-cols-2 max-w-2xl mx-auto'
                  : 'md:grid-cols-3'
              }`}>
                {testimonials.map((t: Testimonial) => (
                  <div
                    key={`${t.name}-${t.role}`}
                    className="rounded-xl border border-border bg-card p-6 flex flex-col gap-4"
                  >
                    <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div className="flex items-center gap-3">
                      {t.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={t.avatar}
                          alt={t.name}
                          className="w-9 h-9 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                          {t.initial ?? t.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-sm font-semibold leading-none">{t.name}</p>
                          {t.verified && (
                            <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full leading-none">
                              verified
                            </span>
                          )}
                          {t.betaTester && (
                            <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full leading-none">
                              Beta Tester
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {t.role}
                          {t.company ? ` · ${t.company}` : ''}
                          {t.source ? ` via ${t.source}` : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Founder CTA */}
          <div className="rounded-2xl border border-border bg-card/50 px-8 py-10 text-center max-w-2xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Early access
            </p>
            <h3 className="text-xl font-semibold mb-3">Try it — tell me what you think</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-md mx-auto">
              Kanvi is free to use right now. If you sign up and hit something frustrating
              — or something you love — reply to your welcome email. I read every one.
            </p>
            <Button asChild size="sm">
              <Link href="/register">
                Get early access
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Link>
            </Button>
          </div>

        </div>
      </section>

      {/* ── Comparison table ─────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              How Kanvi compares
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              A straight comparison. No spin.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[520px] text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-4 font-medium text-muted-foreground w-[36%]" />
                  <th className="px-4 py-4 text-center font-semibold text-primary bg-primary/5">Kanvi</th>
                  <th className="px-4 py-4 text-center font-medium text-muted-foreground">Trello</th>
                  <th className="px-4 py-4 text-center font-medium text-muted-foreground">Notion</th>
                  <th className="px-4 py-4 text-center font-medium text-muted-foreground">ClickUp</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    feature: 'Unlimited boards',
                    kanvi: { type: 'yes' },
                    trello: { type: 'no', note: '10 boards on free' },
                    notion: { type: 'partial', note: 'Pages, not boards' },
                    clickup: { type: 'yes' },
                  },
                  {
                    feature: 'Built for Kanban',
                    kanvi: { type: 'yes' },
                    trello: { type: 'yes' },
                    notion: { type: 'no', note: 'General workspace' },
                    clickup: { type: 'partial', note: 'One of many views' },
                  },
                  {
                    feature: 'All core features free',
                    kanvi: { type: 'yes' },
                    trello: { type: 'partial', note: 'Power-Ups cost extra' },
                    notion: { type: 'partial', note: 'Guest limit on free' },
                    clickup: { type: 'partial', note: 'Some features gated' },
                  },
                  {
                    feature: 'Start in under 1 minute',
                    kanvi: { type: 'yes' },
                    trello: { type: 'partial' },
                    notion: { type: 'no', note: 'Complex setup' },
                    clickup: { type: 'no', note: 'Steep learning curve' },
                  },
                ].map((row, i) => (
                  <tr key={row.feature} className={`border-t border-border/60${i % 2 !== 0 ? ' bg-muted/20' : ''}`}>
                    <td className="px-5 py-4 font-medium">{row.feature}</td>
                    {([row.kanvi, row.trello, row.notion, row.clickup] as { type: string; note?: string }[]).map((cell, j) => (
                      <td key={j} className={`px-4 py-4 text-center${j === 0 ? ' bg-primary/5' : ''}`}>
                        <div className="flex flex-col items-center gap-1">
                          {cell.type === 'yes' && <Check className="w-4 h-4 text-emerald-500 mx-auto" />}
                          {cell.type === 'no' && <X className="w-4 h-4 text-muted-foreground/40 mx-auto" />}
                          {cell.type === 'partial' && <Minus className="w-4 h-4 text-amber-400 mx-auto" />}
                          {cell.note && (
                            <span className="text-[10px] text-muted-foreground leading-tight max-w-[80px]">
                              {cell.note}
                            </span>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Based on each tool's free plan as of 2026. ✓ = fully included · — = partial · ✗ = not available
          </p>
        </div>
      </section>

      {/* ── What is Kanvi? — AI search / LLM discoverability ────────────── */}
      <section className="py-16 px-4 bg-surface/40" aria-labelledby="what-is-kanvi">
        <div className="max-w-2xl mx-auto text-center">
          <h2 id="what-is-kanvi" className="text-2xl font-bold tracking-tight mb-4">
            What is Kanvi?
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Kanvi is a client project workspace built for freelancers, consultants, and creative
            professionals. It helps you organize client work, share live project updates, and
            provide client visibility without requiring client accounts or logins.
          </p>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section
        className="py-24 px-4 text-center"
        style={{
          background:
            'radial-gradient(ellipse 60% 80% at 50% 100%, hsl(262 84% 58% / 0.09), transparent)',
        }}
      >
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Your next client board is 30 seconds away.
          </h2>
          <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
            Create your first board in seconds. No credit card. No setup wizard.
            No trial that expires.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="w-full sm:w-auto text-base px-10">
              <Link href="/register">
                Get started free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto text-base px-10"
            >
              <Link href="/login">Sign in</Link>
            </Button>
          </div>

          <div className="mt-10 pt-8 border-t border-border/40">
            <p className="text-sm text-muted-foreground mb-3">
              Not ready yet? Leave your email — we'll let you know when we ship new features.
            </p>
            <EmailCapture />
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/60 py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-sm tracking-tight">
            <KanbanLogo size={18} />
            Kanvi
          </Link>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/pricing" className="hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link href="/login" className="hover:text-foreground transition-colors">
              Sign in
            </Link>
          </nav>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Kanvi
          </p>
        </div>
      </footer>

    </div>
  );
}
