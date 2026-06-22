import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useBoardStore } from '@/store/board';

export const usePolling = (interval: number) => {
  const router = useRouter();
  const intervalId = useRef<NodeJS.Timeout | null>(null);
  const activeTask = useBoardStore((s) => s.activeTask);
  const isDragging = useBoardStore((s) => s.isDragging);

  useEffect(() => {
    intervalId.current = setInterval(() => {
      if (!activeTask && !isDragging) {
        router.refresh();
      }
    }, interval);

    return () => {
      if (intervalId.current) {
        clearInterval(intervalId.current);
      }
    };
  }, [router, interval, activeTask, isDragging]);
};
