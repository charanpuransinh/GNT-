// M14 Frontend — Import Store (Zustand)
// Lock: LOCK_03_STORE
import { create } from 'zustand';
import { importApi } from '../api';
import { ImportJob, ValidationResult, UploadPayload } from '../types';

interface ImportState {
  jobs: ImportJob[];
  currentJob: ImportJob | null;
  validation: ValidationResult | null;
  isLoading: boolean;
  error: string | null;
  uploadProgress: number;

  // Actions
  uploadFile: (payload: UploadPayload) => Promise<string>;
  validateJob: (jobId: string) => Promise<ValidationResult>;
  fetchJob: (jobId: string) => Promise<void>;
  fetchJobs: (filters?: { module?: string; entityType?: string; status?: string }) => Promise<void>;
  cancelJob: (jobId: string) => Promise<void>;
  retryJob: (jobId: string) => Promise<void>;
  pollJob: (jobId: string, interval?: number) => () => void;
  clearError: () => void;
  setCurrentJob: (job: ImportJob | null) => void;
}

export const useImportStore = create<ImportState>((set, get) => ({
  jobs: [],
  currentJob: null,
  validation: null,
  isLoading: false,
  error: null,
  uploadProgress: 0,

  uploadFile: async (payload) => {
    set({ isLoading: true, error: null, uploadProgress: 0 });
    try {
      const res = await importApi.upload(payload);
      set({ isLoading: false, uploadProgress: 100 });
      return res.jobId;
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.error || err.message });
      throw err;
    }
  },

  validateJob: async (jobId) => {
    set({ isLoading: true, error: null });
    try {
      const result = await importApi.validate(jobId);
      set({ validation: result, isLoading: false });
      return result;
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.error || err.message });
      throw err;
    }
  },

  fetchJob: async (jobId) => {
    set({ isLoading: true, error: null });
    try {
      const job = await importApi.getJob(jobId);
      set({ currentJob: job, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.error || err.message });
    }
  },

  fetchJobs: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const jobs = await importApi.listJobs(filters);
      set({ jobs, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.error || err.message });
    }
  },

  cancelJob: async (jobId) => {
    set({ isLoading: true, error: null });
    try {
      await importApi.cancel(jobId);
      await get().fetchJobs();
      set({ isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.error || err.message });
    }
  },

  retryJob: async (jobId) => {
    set({ isLoading: true, error: null });
    try {
      await importApi.retry(jobId);
      await get().fetchJobs();
      set({ isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.error || err.message });
    }
  },

  pollJob: (jobId, interval = 3000) => {
    const timer = setInterval(async () => {
      try {
        const job = await importApi.getJob(jobId);
        set({ currentJob: job });
        if (job.status === 'COMPLETED' || job.status === 'FAILED' || job.status === 'CANCELLED') {
          clearInterval(timer);
        }
      } catch {
        clearInterval(timer);
      }
    }, interval);
    return () => clearInterval(timer);
  },

  clearError: () => set({ error: null }),
  setCurrentJob: (job) => set({ currentJob: job }),
}));
