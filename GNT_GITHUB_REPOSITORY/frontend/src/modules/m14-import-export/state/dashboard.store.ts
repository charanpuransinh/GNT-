// M14 Frontend — Dashboard Store (Zustand)
// Lock: LOCK_03_STORE
import { create } from 'zustand';
import { dashboardApi } from '../api';
import { DashboardStats } from '../types';

interface DashboardState {
  stats: DashboardStats | null;
  isLoading: boolean;
  error: string | null;

  fetchStats: () => Promise<void>;
  cleanup: (days?: number) => Promise<void>;
  clearError: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  isLoading: false,
  error: null,

  fetchStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const stats = await dashboardApi.getStats();
      set({ stats, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.error || err.message });
    }
  },

  cleanup: async (days = 30) => {
    set({ isLoading: true, error: null });
    try {
      await dashboardApi.cleanup(days);
      await dashboardApi.getStats();
      set({ isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.error || err.message });
    }
  },

  clearError: () => set({ error: null }),
}));
