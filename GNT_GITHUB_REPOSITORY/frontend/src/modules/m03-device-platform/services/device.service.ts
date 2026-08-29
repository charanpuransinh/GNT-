import { apiClient } from '@/core/api-client';
import {
  DeviceSession,
  DeviceInfo,
  UpdateInfo,
  DeploymentSettings,
  ApiResponse,
} from './device.types';

const BASE_PATH = '/api/v1/device';

export const deviceService = {
  async getActiveSessions(): Promise<DeviceSession[]> {
    const response = await apiClient.get<ApiResponse<DeviceSession[]>>(`${BASE_PATH}/sessions`);
    return response.data.data;
  },

  async terminateSession(sessionId: string): Promise<void> {
    await apiClient.delete(`${BASE_PATH}/sessions/${sessionId}`);
  },

  async terminateAllSessions(): Promise<void> {
    await apiClient.delete(`${BASE_PATH}/sessions`);
  },

  async registerDevice(deviceInfo: Partial<DeviceInfo>): Promise<DeviceInfo> {
    const response = await apiClient.post<ApiResponse<DeviceInfo>>(`${BASE_PATH}/register`, deviceInfo);
    return response.data.data;
  },

  async getRegisteredDevices(): Promise<DeviceInfo[]> {
    const response = await apiClient.get<ApiResponse<DeviceInfo[]>>(`${BASE_PATH}/devices`);
    return response.data.data;
  },

  async checkForUpdate(): Promise<UpdateInfo> {
    const response = await apiClient.get<ApiResponse<UpdateInfo>>(`${BASE_PATH}/update-check`);
    return response.data.data;
  },

  async downloadUpdate(): Promise<void> {
    await apiClient.post(`${BASE_PATH}/download-update`);
  },

  async getDeploymentSettings(): Promise<DeploymentSettings> {
    const response = await apiClient.get<ApiResponse<DeploymentSettings>>(`${BASE_PATH}/settings`);
    return response.data.data;
  },

  async updateDeploymentSettings(settings: DeploymentSettings): Promise<void> {
    await apiClient.put(`${BASE_PATH}/settings`, settings);
  },
};
