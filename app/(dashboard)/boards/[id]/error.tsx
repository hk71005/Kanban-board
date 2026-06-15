'use client';

import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <h2 className="mb-4 text-2xl font-semibold text-destructive">
        Something went wrong!
      </h2>
      <p className="mb-6 text-muted-foreground">
        {error.message || 'An unexpected error occurred while loading the board.'}
      </p>
      <Button
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => reset()
        }
      >
        Try again
      </Button>
    </div>
  );
}