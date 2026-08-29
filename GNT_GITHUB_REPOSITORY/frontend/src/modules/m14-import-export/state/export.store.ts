// M14 Frontend — Export Store (Zustand)
// Lock: LOCK_03_STORE
import { create } from 'zustand';
import { exportApi } from '../api';
import { ExportJob, ExportPayload } from '../types';

interface ExportState {
  jobs: ExportJob[];
  currentJob: ExportJob | null;
  isLoading: boolean;
  error: string | null;
  downloadUrl: string | null;

  createExport: (payload: ExportPayload) => Promise<string>;
  fetchJob: (jobId: string) => Promise<void>;
  fetchJobs: (filters?: { module?: string; entityType?: string; status?: string }) => Promise<void>;
  cancelJob: (jobId: string) => Promise<void>;
  downloadFile: (jobId: string, filename: string) => Promise<void>;
  pollJob: (jobId: string, interval?: number) => () => void;
  clearError: () => void;
  setCurrentJob: (job: ExportJob | null) => void;
}

export const useExportStore = create<ExportState>((set, get) => ({
  jobs: [],
  currentJob: null,
  isLoading: false,
  error: null,
  downloadUrl: null,

  createExport: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const res = await exportApi.create(payload);
      set({ isLoading: false });
      return res.jobId;
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.error || err.message });
      throw err;
    }
  },

  fetchJob: async (jobId) => {
    set({ isLoading: true, error: null });
    try {
      const job = await exportApi.getJob(jobId);
      set({ currentJob: job, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.error || err.message });
    }
  },

  fetchJobs: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const jobs = await exportApi.listJobs(filters);
      set({ jobs, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.error || err.message });
    }
  },

  cancelJob: async (jobId) => {
    set({ isLoading: true, error: null });
    try {
      await exportApi.cancel(jobId);
      await get().fetchJobs();
      set({ isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.error || err.message });
    }
  },

  downloadFile: async (jobId, filename) => {
    set({ isLoading: true, error: null });
    try {
      const blob = await exportApi.download(jobId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      set({ isLoading: false, downloadUrl: url });
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.error || err.message });
    }
  },

  pollJob: (jobId, interval = 3000) => {
    const timer = setInterval(async () => {
      try {
        const job = await exportApi.getJob(jobId);
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
