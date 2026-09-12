/**
 * M18 — Frontend Integration Service (API Calls)
 * Owner: D4-DELTA
 *
 * पहले raw fetch() था — कोई Authorization header नहीं जाता था (apiClient जोड़ता
 * है), हर call 401।
 */
import { apiClient } from '@/core/api-client';
import {
  IntegrationConfig,
  CreateIntegrationConfigDto,
  UpdateIntegrationConfigDto,
  ApiKeyResponse,
  GatewayStatusDto,
  GatewayTestResult,
  PaginatedResponse,
} from './integration.types';

const API_BASE = '/api/v1/integrations';

export const IntegrationApi = {
  // Integrations
  list: async (params?: Record<string, string>) =>
    (await apiClient.get<PaginatedResponse<IntegrationConfig>>(API_BASE, { params })).data,

  get: async (id: string) =>
    (await apiClient.get<{ success: boolean; data: IntegrationConfig }>(`${API_BASE}/${id}`)).data,

  create: async (dto: CreateIntegrationConfigDto) =>
    (await apiClient.post<{ success: boolean; data: IntegrationConfig }>(API_BASE, dto)).data,

  update: async (id: string, dto: UpdateIntegrationConfigDto) =>
    (await apiClient.put<{ success: boolean; data: IntegrationConfig }>(`${API_BASE}/${id}`, dto)).data,

  remove: async (id: string) =>
    (await apiClient.delete<{ success: boolean; data: IntegrationConfig }>(`${API_BASE}/${id}`)).data,

  // Testing & Status
  test: async (integrationId: string) =>
    (await apiClient.post<{ success: boolean; data: GatewayTestResult }>(`${API_BASE}/test`, { integration_id: integrationId })).data,

  status: async (companyId: string, type?: string) =>
    (await apiClient.get<{ success: boolean; data: GatewayStatusDto[] }>(`${API_BASE}/status`, { params: { company_id: companyId, type } })).data,

  // API Keys
  generateKey: async (dto: { company_id: string; name: string; permissions: string[]; expires_at?: string | null; created_by: string }) =>
    (await apiClient.post<{ success: boolean; data: ApiKeyResponse }>(`${API_BASE}/api-keys`, dto)).data,

  listKeys: async (companyId: string) =>
    (await apiClient.get<{ success: boolean; data: ApiKeyResponse[] }>(`${API_BASE}/api-keys`, { params: { company_id: companyId } })).data,

  revokeKey: async (id: string) =>
    (await apiClient.delete<{ success: boolean; message: string }>(`${API_BASE}/api-keys/${id}`)).data,
};
