import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";

export const metadata: Metadata = {
  metadataBase: new URL('https://kanvi.app'),
  title: "Kanvi — The Kanban board your team will actually use.",
  description: "A clean, modern Kanban workspace with drag-and-drop boards, team collaboration, due dates, subtasks, and real-time progress tracking. Free to start.",
  openGraph: {
    type: 'website',
    siteName: 'Kanvi',
    title: 'Kanvi — The Kanban board your team will actually use.',
    description: 'A clean, modern Kanban workspace with drag-and-drop boards, team collaboration, due dates, subtasks, and real-time progress tracking. Free to start.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kanvi — The Kanban board your team will actually use.',
    description: 'A clean, modern Kanban workspace with drag-and-drop boards, team collaboration, due dates, subtasks, and real-time progress tracking. Free to start.',
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