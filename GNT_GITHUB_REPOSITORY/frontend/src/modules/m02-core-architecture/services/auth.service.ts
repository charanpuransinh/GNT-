import { apiClient } from '@/core/api-client';
import {
  LoginRequest,
  LoginResponse,
  OTPVerifyRequest,
  OTPVerifyResponse,
  UserProfile,
  Role,
  ApiResponse,
} from './auth.types';

const BASE_PATH = '/api/v1/auth';

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<ApiResponse<LoginResponse>>(
      `${BASE_PATH}/login`,
      credentials
    );
    return response.data.data;
  },

  async verifyOtp(data: OTPVerifyRequest): Promise<OTPVerifyResponse> {
    const response = await apiClient.post<ApiResponse<OTPVerifyResponse>>(
      `${BASE_PATH}/otp-verify`,
      data
    );
    return response.data.data;
  },

  async selectRole(roleId: string): Promise<{ success: boolean }> {
    const response = await apiClient.post<ApiResponse<{ success: boolean }>>(
      `${BASE_PATH}/select-role`,
      { roleId }
    );
    return response.data.data;
  },

  async refreshToken(): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await apiClient.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
      `${BASE_PATH}/refresh`
    );
    return response.data.data;
  },

  async logout(): Promise<void> {
    await apiClient.post(`${BASE_PATH}/logout`);
    // Clear local storage tokens
    localStorage.removeItem('gnt_access_token');
    localStorage.removeItem('gnt_refresh_token');
    window.location.href = '/login';
  },

  async getCurrentUser(): Promise<UserProfile> {
    const response = await apiClient.get<ApiResponse<UserProfile>>(`${BASE_PATH}/me`);
    return response.data.data;
  },

  async unlockSession(pin: string): Promise<void> {
    await apiClient.post(`${BASE_PATH}/unlock`, { pin });
  },
};
