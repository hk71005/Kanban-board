import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";

export const metadata: Metadata = {
  metadataBase: new URL('https://kanvi.app'),
  title: "Kanvi — The Kanban board built for freelancers and their clients.",
  description: "Manage client projects on a clean Kanban board. Share live progress with any client — no account needed. Unlimited boards, free to start.",
  openGraph: {
    type: 'website',
    siteName: 'Kanvi',
    url: 'https://kanvi.app',
    title: 'Kanvi — The Kanban board built for freelancers and their clients.',
    description: 'Manage client projects on a clean Kanban board. Share live progress with any client — no account needed. Unlimited boards, free to start.',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Kanvi — client project workspace for freelancers' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kanvi — The Kanban board built for freelancers and their clients.',
    description: 'Manage client projects on a clean Kanban board. Share live progress with any client — no account needed. Unlimited boards, free to start.',
    images: ['/opengraph-image'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="bottom-right" theme="system" />
        </ThemeProvider>
      </body>
    </html>
  );
}