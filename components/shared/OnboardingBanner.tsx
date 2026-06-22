'use client';

import { useEffect, useState } from 'react';
import { PlusSquare, Clock, Share2, X } from 'lucide-react';

const STEPS = [
  {
    icon: PlusSquare,
    title: 'Add your tasks',
    description: 'Click "New Task" or press N to quickly create tasks in any column.',
  },
  {
    icon: Clock,
    title: 'Mark waiting on client',
    description: 'Open a task and toggle "Waiting on client" to flag it for follow-up.',
  },
  {
    icon: Share2,
    title: 'Share a client portal',
    description: 'Hit "Share" in the board header to give clients a read-only view.',
  },
];

export default function OnboardingBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('kanvi_ob_dismissed')) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem('kanvi_ob_dismissed', '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="mx-4 mt-3 rounded-xl border border-primary/20 bg-primary/5 p-4 flex gap-3 items-start">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground mb-3">Get started with Kanvi</p>
        <div className="flex flex-col sm:flex-row gap-4">
          {STEPS.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex items-start gap-2.5 flex-1">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        aria-label="Dismiss onboarding tips"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
