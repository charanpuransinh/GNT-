import { apiClient } from '@/core/api-client';
import { AppConfig, HealthStatus, SystemInfo, ApiResponse } from './app.types';

const BASE_PATH = '/api/v1/foundation';

export const appService = {
  async getAppConfig(): Promise<AppConfig> {
    const response = await apiClient.get<ApiResponse<AppConfig>>(`${BASE_PATH}/config`);
    return response.data.data;
  },

  async getHealthStatus(): Promise<HealthStatus> {
    const response = await apiClient.get<ApiResponse<HealthStatus>>(`${BASE_PATH}/health`);
    return response.data.data;
  },

  async getSystemInfo(): Promise<SystemInfo> {
    const response = await apiClient.get<ApiResponse<SystemInfo>>(`${BASE_PATH}/system-info`);
    return response.data.data;
  },

  async checkMaintenance(): Promise<{ maintenanceMode: boolean; message?: string }> {
    const response = await apiClient.get<ApiResponse<{ maintenanceMode: boolean; message?: string }>>(
      `${BASE_PATH}/maintenance`
    );
    return response.data.data;
  },
};
