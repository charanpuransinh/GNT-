import { useState, useCallback, useEffect, useRef } from 'react';
import { useSyncStore } from '../store/syncStore';
import { SyncAPI } from '../api/sync.api';

export const useSyncJobs = (jobId?: string) => {
  const [isPolling, setIsPolling] = useState(false);
  const store = useSyncStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startPolling = useCallback((targetJobId: string) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsPolling(true);

    intervalRef.current = setInterval(async () => {
      try {
        const progress = await SyncAPI.getJobProgress(targetJobId);
        store.setJobProgress(progress);
        if (progress?.status === 'COMPLETED' || progress?.status === 'FAILED' || progress?.status === 'CANCELLED') {
          stopPolling();
        }
      } catch {
        stopPolling();
      }
    }, 2000);
  }, [store]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  return { isPolling, startPolling, stopPolling };
};
