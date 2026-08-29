// M14 Frontend — API Layer
// Lock: LOCK_02_API
import axios from 'axios';
import {
  ImportJob, ExportJob, ImportTemplate, ExportTemplate,
  ValidationResult, DashboardStats, UploadPayload, ExportPayload
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api/m14';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach auth/tenant headers from localStorage or context
api.interceptors.request.use((config) => {
  const tenantId = localStorage.getItem('tenantId') || 'mock-tenant';
  const token = localStorage.getItem('token') || '';
  config.headers['x-tenant-id'] = tenantId;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Import APIs ───
export const importApi = {
  upload: async (payload: UploadPayload): Promise<{ success: boolean; jobId: string; message: string }> => {
    const formData = new FormData();
    formData.append('file', payload.file);
    formData.append('module', payload.module);
    formData.append('entityType', payload.entityType);
    if (payload.templateId) formData.append('templateId', payload.templateId);
    if (payload.mappingOverride) formData.append('mappingOverride', JSON.stringify(payload.mappingOverride));
    if (payload.dryRun) formData.append('dryRun', 'true');

    const res = await api.post('/imports/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  validate: async (jobId: string): Promise<ValidationResult> => {
    const res = await api.post(`/imports/${jobId}/validate`);
    return res.data;
  },

  getJob: async (jobId: string): Promise<ImportJob> => {
    const res = await api.get(`/imports/${jobId}`);
    return res.data;
  },

  listJobs: async (filters?: { module?: string; entityType?: string; status?: string }): Promise<ImportJob[]> => {
    const res = await api.get('/imports', { params: filters });
    return res.data;
  },

  cancel: async (jobId: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.post(`/imports/${jobId}/cancel`);
    return res.data;
  },

  retry: async (jobId: string): Promise<{ success: boolean; jobId: string; message: string }> => {
    const res = await api.post(`/imports/${jobId}/retry`);
    return res.data;
  },
};

// ─── Export APIs ───
export const exportApi = {
  create: async (payload: ExportPayload): Promise<{ success: boolean; jobId: string; message: string }> => {
    const res = await api.post('/exports', payload);
    return res.data;
  },

  getJob: async (jobId: string): Promise<ExportJob> => {
    const res = await api.get(`/exports/${jobId}`);
    return res.data;
  },

  listJobs: async (filters?: { module?: string; entityType?: string; status?: string }): Promise<ExportJob[]> => {
    const res = await api.get('/exports', { params: filters });
    return res.data;
  },

  cancel: async (jobId: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.post(`/exports/${jobId}/cancel`);
    return res.data;
  },

  download: async (jobId: string): Promise<Blob> => {
    const res = await api.get(`/exports/${jobId}/download`, { responseType: 'blob' });
    return res.data;
  },
};

// ─── Template APIs ───
export const templateApi = {
  create: async (data: Partial<ImportTemplate>): Promise<ImportTemplate> => {
    const res = await api.post('/templates', data);
    return res.data;
  },

  list: async (params?: { module?: string; entityType?: string }): Promise<ImportTemplate[]> => {
    const res = await api.get('/templates', { params });
    return res.data;
  },

  getById: async (id: string): Promise<ImportTemplate> => {
    const res = await api.get(`/templates/${id}`);
    return res.data;
  },

  update: async (id: string, data: Partial<ImportTemplate>): Promise<ImportTemplate> => {
    const res = await api.put(`/templates/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    const res = await api.delete(`/templates/${id}`);
    return res.data;
  },
};

// ─── Dashboard APIs ───
export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const res = await api.get('/jobs/dashboard');
    return res.data;
  },

  cleanup: async (days = 30): Promise<{ deletedImports: number; deletedExports: number }> => {
    const res = await api.post('/jobs/cleanup', null, { params: { days } });
    return res.data;
  },
};

export default api;
