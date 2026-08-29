/**
 * M18 — Frontend Integration Service (API Calls)
 * Owner: D4-DELTA
 */
import {
  IntegrationConfig,
  CreateIntegrationConfigDto,
  UpdateIntegrationConfigDto,
  ApiKeyResponse,
  GatewayStatusDto,
  GatewayTestResult,
  PaginatedResponse,
} from './integration.types';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api/v1';

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export const IntegrationApi = {
  // Integrations
  list: (params?: Record<string, string>) =>
    api<PaginatedResponse<IntegrationConfig>>(`/integrations?${new URLSearchParams(params).toString()}`),

  get: (id: string) =>
    api<{ success: boolean; data: IntegrationConfig }>(`/integrations/${id}`),

  create: (dto: CreateIntegrationConfigDto) =>
    api<{ success: boolean; data: IntegrationConfig }>('/integrations', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  update: (id: string, dto: UpdateIntegrationConfigDto) =>
    api<{ success: boolean; data: IntegrationConfig }>(`/integrations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    }),

  remove: (id: string) =>
    api<{ success: boolean; data: IntegrationConfig }>(`/integrations/${id}`, {
      method: 'DELETE',
    }),

  // Testing & Status
  test: (integrationId: string) =>
    api<{ success: boolean; data: GatewayTestResult }>('/integrations/test', {
      method: 'POST',
      body: JSON.stringify({ integration_id: integrationId }),
    }),

  status: (companyId: string, type?: string) =>
    api<{ success: boolean; data: GatewayStatusDto[] }>(
      `/integrations/status?company_id=${companyId}${type ? `&type=${type}` : ''}`
    ),

  // API Keys
  generateKey: (dto: { company_id: string; name: string; permissions: string[]; expires_at?: string | null; created_by: string }) =>
    api<{ success: boolean; data: ApiKeyResponse }>('/integrations/api-keys', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  listKeys: (companyId: string) =>
    api<{ success: boolean; data: ApiKeyResponse[] }>(`/integrations/api-keys?company_id=${companyId}`),

  revokeKey: (id: string) =>
    api<{ success: boolean; message: string }>(`/integrations/api-keys/${id}`, {
      method: 'DELETE',
    }),
};
