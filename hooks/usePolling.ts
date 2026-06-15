import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useBoardStore } from '@/store/board';

export const usePolling = (interval: number) => {
  const router = useRouter();
  const intervalId = useRef<NodeJS.Timeout | null>(null);
  const activeTask = useBoardStore((s) => s.activeTask);

  useEffect(() => {
    intervalId.current = setInterval(() => {
      if (!activeTask) {
        router.refresh();
      }
    }, interval);

    return () => {
      if (intervalId.current) {
        clearInterval(intervalId.current);
      }
    };
  }, [router, interval, activeTask]);
};