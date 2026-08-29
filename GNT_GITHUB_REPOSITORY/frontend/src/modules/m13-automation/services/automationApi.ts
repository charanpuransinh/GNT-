/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║  M13 AUTOMATION — API SERVICE                                ║
 * ║  Lock Artifact #4 — HTTP Client Layer                        ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  AutomationWorkflow,
  ScheduledJob,
  ExecutionLog,
  AutomationTemplate,
  AutomationRule,
  AutomationFilters,
} from '../types/automation.types';

// ── Axios Instance with Tenant & Auth Interceptors ──
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor — Attach Auth Token + Tenant Header
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    const tenantId = localStorage.getItem('tenant_id');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (tenantId) config.headers['X-Tenant-ID'] = tenantId;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor — Global Error Handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // TEMP MOCK: In real app, redirect to login or refresh token
      console.warn('[M13] Auth expired — TEMP MOCK handler');
    }
    return Promise.reject(error);
  }
);

// ── Generic API Response Wrapper ──
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ── WORKFLOW API ──
export const WorkflowAPI = {
  getAll: (filters?: AutomationFilters): Promise<AxiosResponse<ApiResponse<AutomationWorkflow[]>>> =>
    apiClient.get('/automation/workflows', { params: filters }),

  getById: (id: string): Promise<AxiosResponse<ApiResponse<AutomationWorkflow>>> =>
    apiClient.get(`/automation/workflows/${id}`),

  create: (data: Partial<AutomationWorkflow>): Promise<AxiosResponse<ApiResponse<AutomationWorkflow>>> =>
    apiClient.post('/automation/workflows', data),

  update: (id: string, data: Partial<AutomationWorkflow>): Promise<AxiosResponse<ApiResponse<AutomationWorkflow>>> =>
    apiClient.patch(`/automation/workflows/${id}`, data),

  delete: (id: string): Promise<AxiosResponse<ApiResponse<void>>> =>
    apiClient.delete(`/automation/workflows/${id}`),

  toggleStatus: (id: string, status: 'active' | 'paused'): Promise<AxiosResponse<ApiResponse<AutomationWorkflow>>> =>
    apiClient.patch(`/automation/workflows/${id}/status`, { status }),

  execute: (id: string, payload?: Record<string, any>): Promise<AxiosResponse<ApiResponse<{ executionId: string }>>> =>
    apiClient.post(`/automation/workflows/${id}/execute`, payload),

  duplicate: (id: string): Promise<AxiosResponse<ApiResponse<AutomationWorkflow>>> =>
    apiClient.post(`/automation/workflows/${id}/duplicate`),
};

// ── SCHEDULED JOBS API ──
export const ScheduledJobAPI = {
  getAll: (): Promise<AxiosResponse<ApiResponse<ScheduledJob[]>>> =>
    apiClient.get('/automation/jobs'),

  getById: (id: string): Promise<AxiosResponse<ApiResponse<ScheduledJob>>> =>
    apiClient.get(`/automation/jobs/${id}`),

  create: (data: Partial<ScheduledJob>): Promise<AxiosResponse<ApiResponse<ScheduledJob>>> =>
    apiClient.post('/automation/jobs', data),

  update: (id: string, data: Partial<ScheduledJob>): Promise<AxiosResponse<ApiResponse<ScheduledJob>>> =>
    apiClient.patch(`/automation/jobs/${id}`, data),

  delete: (id: string): Promise<AxiosResponse<ApiResponse<void>>> =>
    apiClient.delete(`/automation/jobs/${id}`),

  toggle: (id: string, enabled: boolean): Promise<AxiosResponse<ApiResponse<ScheduledJob>>> =>
    apiClient.patch(`/automation/jobs/${id}/toggle`, { enabled }),

  runNow: (id: string): Promise<AxiosResponse<ApiResponse<{ executionId: string }>>> =>
    apiClient.post(`/automation/jobs/${id}/run-now`),
};

// ── EXECUTION LOGS API ──
export const ExecutionLogAPI = {
  getAll: (params?: { page?: number; limit?: number; workflowId?: string; status?: string }): Promise<AxiosResponse<ApiResponse<ExecutionLog[]>>> =>
    apiClient.get('/automation/logs', { params }),

  getById: (id: string): Promise<AxiosResponse<ApiResponse<ExecutionLog>>> =>
    apiClient.get(`/automation/logs/${id}`),

  retry: (id: string): Promise<AxiosResponse<ApiResponse<{ executionId: string }>>> =>
    apiClient.post(`/automation/logs/${id}/retry`),
};

// ── TEMPLATES API ──
export const TemplateAPI = {
  getAll: (): Promise<AxiosResponse<ApiResponse<AutomationTemplate[]>>> =>
    apiClient.get('/automation/templates'),

  getById: (id: string): Promise<AxiosResponse<ApiResponse<AutomationTemplate>>> =>
    apiClient.get(`/automation/templates/${id}`),

  createFromTemplate: (templateId: string, overrides?: Partial<AutomationWorkflow>): Promise<AxiosResponse<ApiResponse<AutomationWorkflow>>> =>
    apiClient.post(`/automation/templates/${templateId}/use`, overrides),
};

// ── RULES API ──
export const RuleAPI = {
  getAll: (): Promise<AxiosResponse<ApiResponse<AutomationRule[]>>> =>
    apiClient.get('/automation/rules'),

  getById: (id: string): Promise<AxiosResponse<ApiResponse<AutomationRule>>> =>
    apiClient.get(`/automation/rules/${id}`),

  create: (data: Partial<AutomationRule>): Promise<AxiosResponse<ApiResponse<AutomationRule>>> =>
    apiClient.post('/automation/rules', data),

  update: (id: string, data: Partial<AutomationRule>): Promise<AxiosResponse<ApiResponse<AutomationRule>>> =>
    apiClient.patch(`/automation/rules/${id}`, data),

  delete: (id: string): Promise<AxiosResponse<ApiResponse<void>>> =>
    apiClient.delete(`/automation/rules/${id}`),

  toggleStatus: (id: string, status: 'active' | 'paused'): Promise<AxiosResponse<ApiResponse<AutomationRule>>> =>
    apiClient.patch(`/automation/rules/${id}/status`, { status }),
};

export default apiClient;
