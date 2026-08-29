/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║  M14 IMPORT/EXPORT — API SERVICE                           ║
 * ║  Lock Artifact #4 — HTTP Client Layer                        ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  ImportJob, ExportJob, ImportTemplate, ExportTemplate,
  ImportPreview, ImportProgress, ExportProgress, UploadResult,
  ImportFilters, ExportFilters,
} from '../types/importExport.types';

// ── Axios Instance ──
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
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

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('[M14] Auth expired — TEMP MOCK handler');
    }
    return Promise.reject(error);
  }
);

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

// ── IMPORT JOBS API ──
export const ImportJobAPI = {
  getAll: (filters?: ImportFilters): Promise<AxiosResponse<ApiResponse<ImportJob[]>>> =>
    apiClient.get('/imports', { params: filters }),

  getById: (id: string): Promise<AxiosResponse<ApiResponse<ImportJob>>> =>
    apiClient.get(`/imports/${id}`),

  create: (data: Partial<ImportJob>): Promise<AxiosResponse<ApiResponse<ImportJob>>> =>
    apiClient.post('/imports', data),

  update: (id: string, data: Partial<ImportJob>): Promise<AxiosResponse<ApiResponse<ImportJob>>> =>
    apiClient.patch(`/imports/${id}`, data),

  delete: (id: string): Promise<AxiosResponse<ApiResponse<void>>> =>
    apiClient.delete(`/imports/${id}`),

  uploadFile: (file: File): Promise<AxiosResponse<ApiResponse<UploadResult>>> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/imports/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  preview: (id: string): Promise<AxiosResponse<ApiResponse<ImportPreview>>> =>
    apiClient.post(`/imports/${id}/preview`),

  validate: (id: string): Promise<AxiosResponse<ApiResponse<{ valid: boolean; errors: any[]; totalChecked: number }>>> =>
    apiClient.post(`/imports/${id}/validate`),

  execute: (id: string): Promise<AxiosResponse<ApiResponse<ImportJob>>> =>
    apiClient.post(`/imports/${id}/execute`),

  executeDryRun: (id: string): Promise<AxiosResponse<ApiResponse<any>>> =>
    apiClient.post(`/imports/${id}/execute-dry`),

  getProgress: (id: string): Promise<AxiosResponse<ApiResponse<ImportProgress>>> =>
    apiClient.get(`/imports/${id}/progress`),

  getErrors: (id: string, params?: { page?: number; limit?: number }): Promise<AxiosResponse<ApiResponse<any>>> =>
    apiClient.get(`/imports/${id}/errors`, { params }),

  downloadErrorReport: (id: string): Promise<AxiosResponse<Blob>> =>
    apiClient.get(`/imports/${id}/download-errors`, { responseType: 'blob' }),

  cancel: (id: string): Promise<AxiosResponse<ApiResponse<ImportJob>>> =>
    apiClient.post(`/imports/${id}/cancel`),

  retry: (id: string): Promise<AxiosResponse<ApiResponse<ImportJob>>> =>
    apiClient.post(`/imports/${id}/retry`),
};

// ── EXPORT JOBS API ──
export const ExportJobAPI = {
  getAll: (filters?: ExportFilters): Promise<AxiosResponse<ApiResponse<ExportJob[]>>> =>
    apiClient.get('/exports', { params: filters }),

  getById: (id: string): Promise<AxiosResponse<ApiResponse<ExportJob>>> =>
    apiClient.get(`/exports/${id}`),

  create: (data: Partial<ExportJob>): Promise<AxiosResponse<ApiResponse<ExportJob>>> =>
    apiClient.post('/exports', data),

  update: (id: string, data: Partial<ExportJob>): Promise<AxiosResponse<ApiResponse<ExportJob>>> =>
    apiClient.patch(`/exports/${id}`, data),

  delete: (id: string): Promise<AxiosResponse<ApiResponse<void>>> =>
    apiClient.delete(`/exports/${id}`),

  execute: (id: string): Promise<AxiosResponse<ApiResponse<ExportJob>>> =>
    apiClient.post(`/exports/${id}/execute`),

  getProgress: (id: string): Promise<AxiosResponse<ApiResponse<ExportProgress>>> =>
    apiClient.get(`/exports/${id}/progress`),

  download: (id: string): Promise<AxiosResponse<Blob>> =>
    apiClient.get(`/exports/${id}/download`, { responseType: 'blob' }),

  cancel: (id: string): Promise<AxiosResponse<ApiResponse<ExportJob>>> =>
    apiClient.post(`/exports/${id}/cancel`),
};

// ── IMPORT TEMPLATES API ──
export const ImportTemplateAPI = {
  getAll: (entityType?: string): Promise<AxiosResponse<ApiResponse<ImportTemplate[]>>> =>
    apiClient.get('/import-templates', { params: { entityType } }),

  getById: (id: string): Promise<AxiosResponse<ApiResponse<ImportTemplate>>> =>
    apiClient.get(`/import-templates/${id}`),

  create: (data: Partial<ImportTemplate>): Promise<AxiosResponse<ApiResponse<ImportTemplate>>> =>
    apiClient.post('/import-templates', data),

  update: (id: string, data: Partial<ImportTemplate>): Promise<AxiosResponse<ApiResponse<ImportTemplate>>> =>
    apiClient.patch(`/import-templates/${id}`, data),

  delete: (id: string): Promise<AxiosResponse<ApiResponse<void>>> =>
    apiClient.delete(`/import-templates/${id}`),
};

// ── EXPORT TEMPLATES API ──
export const ExportTemplateAPI = {
  getAll: (entityType?: string): Promise<AxiosResponse<ApiResponse<ExportTemplate[]>>> =>
    apiClient.get('/export-templates', { params: { entityType } }),

  getById: (id: string): Promise<AxiosResponse<ApiResponse<ExportTemplate>>> =>
    apiClient.get(`/export-templates/${id}`),

  create: (data: Partial<ExportTemplate>): Promise<AxiosResponse<ApiResponse<ExportTemplate>>> =>
    apiClient.post('/export-templates', data),

  update: (id: string, data: Partial<ExportTemplate>): Promise<AxiosResponse<ApiResponse<ExportTemplate>>> =>
    apiClient.patch(`/export-templates/${id}`, data),

  delete: (id: string): Promise<AxiosResponse<ApiResponse<void>>> =>
    apiClient.delete(`/export-templates/${id}`),
};

export default apiClient;
