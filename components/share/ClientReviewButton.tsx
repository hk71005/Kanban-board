'use client';

import { useState, useTransition } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { acknowledgeClientTask } from '@/actions/share';

interface ClientReviewButtonProps {
  taskId: string;
  shareToken: string;
  initialReviewedAt: Date | string | null;
}

export default function ClientReviewButton({
  taskId,
  shareToken,
  initialReviewedAt,
}: ClientReviewButtonProps) {
  const [reviewedAt, setReviewedAt] = useState<Date | null>(
    initialReviewedAt ? new Date(initialReviewedAt) : null
  );
  const [isPending, startTransition] = useTransition();

  const handleReview = () => {
    if (reviewedAt || isPending) return;
    startTransition(async () => {
      const result = await acknowledgeClientTask(taskId, shareToken);
      if (result.reviewedAt) setReviewedAt(new Date(result.reviewedAt));
    });
  };

  if (reviewedAt) {
    return (
      <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        <span>Reviewed {format(reviewedAt, 'MMM d')}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleReview}
      disabled={isPending}
      className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isPending ? (
        <Loader2 className="w-3 h-3 animate-spin shrink-0" />
      ) : (
        <CheckCircle2 className="w-3 h-3 shrink-0" />
      )}
      Mark Reviewed
    </button>
  );
}
