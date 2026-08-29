import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppConfig } from '../services/app.types';

interface AppState {
  initialized: boolean;
  config: AppConfig | null;
  error: string | null;
  sidebarOpen: boolean;
  setInitialized: (value: boolean) => void;
  setConfig: (config: AppConfig) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      initialized: false,
      config: null,
      error: null,
      sidebarOpen: true,
      setInitialized: (value) => set({ initialized: value }),
      setConfig: (config) => set({ config, error: null }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: 'gnt-app-store',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
