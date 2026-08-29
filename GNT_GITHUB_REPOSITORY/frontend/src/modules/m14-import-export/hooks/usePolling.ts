// M14 Frontend — usePolling Hook
// Lock: LOCK_10_HOOK
import { useEffect, useRef, useCallback } from 'react';

export function usePolling<T>(
  fetcher: () => Promise<T>,
  interval = 3000,
  condition?: (data: T) => boolean
) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(async () => {
      try {
        const data = await fetcher();
        if (condition && condition(data)) {
          stop();
        }
      } catch {
        stop();
      }
    }, interval);
  }, [fetcher, interval, condition]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { start, stop };
}
