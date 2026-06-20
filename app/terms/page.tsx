import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = { title: 'Terms of Service | Kanvi' };

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-10">
    <h2 className="text-lg font-semibold mb-3">{title}</h2>
    <div className="text-muted-foreground text-sm leading-relaxed space-y-3">{children}</div>
  </section>
);

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Kanvi
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-16">
        <div className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight mb-3">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">
            Last updated: June 2026 · These terms govern your use of Kanvi (kanvi.app).
          </p>
        </div>

        <Section title="1. Acceptance of Terms">
          <p>
            By creating an account or using Kanvi, you agree to these Terms of Service. If you do not
            agree, please do not use the service.
          </p>
        </Section>

        <Section title="2. Description of Service">
          <p>
            Kanvi is a kanban-style project management tool that lets you create boards, manage tasks,
            collaborate with team members, and track project progress. The service is currently in open
            beta and is provided free of charge.
          </p>
        </Section>

        <Section title="3. Account Responsibilities">
          <p>You are responsible for:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Maintaining the confidentiality of your account credentials.</li>
            <li>All activity that occurs under your account.</li>
            <li>Ensuring the information you provide is accurate and up to date.</li>
          </ul>
          <p>
            You must be at least 13 years old to use Kanvi. By using the service, you confirm that you
            meet this requirement.
          </p>
        </Section>

        <Section title="4. Acceptable Use">
          <p>You agree not to use Kanvi to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Upload, share, or store any illegal, harmful, or offensive content.</li>
            <li>Attempt to gain unauthorized access to any part of the service or other users' accounts.</li>
            <li>Reverse-engineer, scrape, or otherwise extract data from the service in an unauthorised manner.</li>
            <li>Use the service for any commercial purpose not expressly permitted by these terms.</li>
          </ul>
        </Section>

        <Section title="5. Your Content">
          <p>
            You retain full ownership of the content you create in Kanvi (boards, tasks, comments, etc.).
            By using the service, you grant Kanvi a limited, non-exclusive license to store and display
            your content solely for the purpose of providing the service to you.
          </p>
          <p>
            You are solely responsible for the content you upload. We do not monitor user content but
            reserve the right to remove content that violates these terms.
          </p>
        </Section>

        <Section title="6. Data & Privacy">
          <p>
            Your privacy matters to us. Please review our{' '}
            <Link href="/privacy" className="text-primary underline underline-offset-2">
              Privacy Policy
            </Link>{' '}
            for details on how we collect, use, and protect your personal data.
          </p>
        </Section>

        <Section title="7. Service Availability">
          <p>
            Kanvi is provided on an "as is" and "as available" basis. We aim for high availability
            but do not guarantee uninterrupted access. We may perform maintenance, upgrades, or
            modifications at any time with or without notice.
          </p>
          <p>
            During open beta, features may change, be added, or be removed without prior notice.
          </p>
        </Section>

        <Section title="8. Limitation of Liability">
          <p>
            To the fullest extent permitted by applicable law, Kanvi shall not be liable for any
            indirect, incidental, special, consequential, or punitive damages arising from your use of
            the service, including loss of data, profits, or goodwill.
          </p>
        </Section>

        <Section title="9. Termination">
          <p>
            You may delete your account at any time. We reserve the right to suspend or terminate
            accounts that violate these terms, at our sole discretion, without prior notice.
          </p>
          <p>
            Upon termination, your data will be retained for 30 days before permanent deletion, unless
            you request immediate deletion.
          </p>
        </Section>

        <Section title="10. Changes to These Terms">
          <p>
            We may update these Terms from time to time. When we do, we will update the "Last updated"
            date at the top of this page. Continued use of Kanvi after changes constitutes acceptance
            of the revised Terms.
          </p>
        </Section>

        <Section title="11. Contact">
          <p>
            If you have questions about these Terms, please contact us at{' '}
            <a href="mailto:hello@kanvi.app" className="text-primary underline underline-offset-2">
              hello@kanvi.app
            </a>
            .
          </p>
        </Section>
      </main>

      <footer className="border-t border-border/60 py-8 px-4">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <Link href="/" className="font-semibold text-foreground hover:text-primary transition-colors">
            Kanvi
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          </nav>
          <p className="text-xs">© {new Date().getFullYear()} Kanvi</p>
        </div>
      </footer>
    </div>
  );
}
