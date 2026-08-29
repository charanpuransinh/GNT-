import { create } from 'zustand';
import { SyncConfig, SyncJob, SyncConflict, SyncProgress, ExternalIntegration, BackupJob, ConflictStats } from '../types/sync.types';

interface SyncStore {
  configs: SyncConfig[];
  currentConfig: SyncConfig | null;
  setConfigs: (configs: SyncConfig[]) => void;
  setCurrentConfig: (config: SyncConfig | null) => void;
  addConfig: (config: SyncConfig) => void;
  updateConfig: (config: SyncConfig) => void;
  removeConfig: (id: string) => void;

  jobs: SyncJob[];
  currentJob: SyncJob | null;
  jobProgress: SyncProgress | null;
  setJobs: (jobs: SyncJob[]) => void;
  setCurrentJob: (job: SyncJob | null) => void;
  setJobProgress: (progress: SyncProgress | null) => void;
  addJob: (job: SyncJob) => void;
  updateJob: (job: SyncJob) => void;

  conflicts: SyncConflict[];
  conflictStats: ConflictStats | null;
  setConflicts: (conflicts: SyncConflict[]) => void;
  setConflictStats: (stats: ConflictStats | null) => void;
  resolveConflict: (id: string, resolution: string) => void;

  integrations: ExternalIntegration[];
  setIntegrations: (integrations: ExternalIntegration[]) => void;
  updateIntegration: (integration: ExternalIntegration) => void;

  backups: BackupJob[];
  setBackups: (backups: BackupJob[]) => void;
  addBackup: (backup: BackupJob) => void;

  isLoading: boolean;
  error: string | null;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useSyncStore = create<SyncStore>((set) => ({
  configs: [],
  currentConfig: null,
  setConfigs: (configs) => set({ configs }),
  setCurrentConfig: (config) => set({ currentConfig: config }),
  addConfig: (config) => set((s) => ({ configs: [config, ...s.configs] })),
  updateConfig: (config) => set((s) => ({
    configs: s.configs.map((c) => (c.id === config.id ? config : c))
  })),
  removeConfig: (id) => set((s) => ({ configs: s.configs.filter((c) => c.id !== id) })),

  jobs: [],
  currentJob: null,
  jobProgress: null,
  setJobs: (jobs) => set({ jobs }),
  setCurrentJob: (job) => set({ currentJob: job }),
  setJobProgress: (progress) => set({ jobProgress: progress }),
  addJob: (job) => set((s) => ({ jobs: [job, ...s.jobs] })),
  updateJob: (job) => set((s) => ({
    jobs: s.jobs.map((j) => (j.id === job.id ? job : j))
  })),

  conflicts: [],
  conflictStats: null,
  setConflicts: (conflicts) => set({ conflicts }),
  setConflictStats: (stats) => set({ conflictStats: stats }),
  resolveConflict: (id, resolution) => set((s) => ({
    conflicts: s.conflicts.map((c) =>
      c.id === id ? { ...c, status: 'RESOLVED', resolution } : c
    )
  })),

  integrations: [],
  setIntegrations: (integrations) => set({ integrations }),
  updateIntegration: (integration) => set((s) => ({
    integrations: s.integrations.map((i) => (i.id === integration.id ? integration : i))
  })),

  backups: [],
  setBackups: (backups) => set({ backups }),
  addBackup: (backup) => set((s) => ({ backups: [backup, ...s.backups] })),

  isLoading: false,
  error: null,
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error })
}));
