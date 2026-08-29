import { useState, useCallback } from 'react';
import { useSyncStore } from '../store/syncStore';
import { SyncAPI } from '../api/sync.api';

export const useSync = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const store = useSyncStore();

  const fetchConfigs = useCallback(async (filters?: any) => {
    setLoading(true); setError(null);
    try {
      const data = await SyncAPI.getConfigs(filters);
      store.setConfigs(data);
      return data;
    } catch (err: any) { setError(err.message); throw err; }
    finally { setLoading(false); }
  }, [store]);

  const createConfig = useCallback(async (data: any) => {
    setLoading(true); setError(null);
    try {
      const config = await SyncAPI.createConfig(data);
      store.addConfig(config);
      return config;
    } catch (err: any) { setError(err.message); throw err; }
    finally { setLoading(false); }
  }, [store]);

  const triggerSync = useCallback(async (syncConfigId: string, entityType?: string) => {
    setLoading(true); setError(null);
    try {
      const job = await SyncAPI.triggerSync({ syncConfigId, entityType, triggeredBy: 'USER' });
      store.addJob(job);
      return job;
    } catch (err: any) { setError(err.message); throw err; }
    finally { setLoading(false); }
  }, [store]);

  const fetchJobs = useCallback(async (filters?: any) => {
    setLoading(true);
    try {
      const data = await SyncAPI.getJobs(filters);
      store.setJobs(data);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }, [store]);

  const fetchJobProgress = useCallback(async (jobId: string) => {
    try {
      const progress = await SyncAPI.getJobProgress(jobId);
      store.setJobProgress(progress);
      return progress;
    } catch (err: any) { setError(err.message); }
  }, [store]);

  return { loading, error, fetchConfigs, createConfig, triggerSync, fetchJobs, fetchJobProgress };
};
