import { create } from 'zustand';
import { DeviceSession, DeviceInfo, UpdateInfo, DeploymentSettings } from '../services/device.types';

interface DeviceState {
  sessions: DeviceSession[];
  devices: DeviceInfo[];
  updateInfo: UpdateInfo | null;
  settings: DeploymentSettings | null;
  isLoading: boolean;
  error: string | null;

  setSessions: (sessions: DeviceSession[]) => void;
  setDevices: (devices: DeviceInfo[]) => void;
  setUpdateInfo: (info: UpdateInfo | null) => void;
  setSettings: (settings: DeploymentSettings | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useDeviceStore = create<DeviceState>((set) => ({
  sessions: [],
  devices: [],
  updateInfo: null,
  settings: null,
  isLoading: false,
  error: null,

  setSessions: (sessions) => set({ sessions, error: null }),
  setDevices: (devices) => set({ devices, error: null }),
  setUpdateInfo: (updateInfo) => set({ updateInfo, error: null }),
  setSettings: (settings) => set({ settings, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  clearError: () => set({ error: null }),
}));
