import { apiClient } from '@/lib/api-client';
import { AuditLogDTO, LoginHistoryDTO, SecurityEventDTO, SystemHealthDTO, PaginatedResponse } from './security.types';

export class SecurityService {
  private readonly basePath = '/api/v1';

  async getAuditLogs(params: {
    companyId: string; module?: string; userId?: string;
    startDate?: string; endDate?: string; page?: number; limit?: number;
  }): Promise<PaginatedResponse<AuditLogDTO>> {
    const response = await apiClient.get(`${this.basePath}/audit/logs`, { params });
    return response.data;
  }

  async getLoginHistory(params: {
    companyId: string; userId?: string; status?: 'success' | 'failed';
  }): Promise<LoginHistoryDTO[]> {
    const response = await apiClient.get(`${this.basePath}/audit/login-history`, { params });
    return response.data;
  }

  async getPermissionChanges(params: { companyId: string; userId?: string }): Promise<AuditLogDTO[]> {
    const response = await apiClient.get(`${this.basePath}/audit/permission-changes`, { params });
    return response.data;
  }

  async getSecurityEvents(params: {
    companyId: string; severity?: 'low' | 'medium' | 'high' | 'critical'; resolved?: boolean;
  }): Promise<SecurityEventDTO[]> {
    const response = await apiClient.get(`${this.basePath}/security/events`, { params });
    return response.data;
  }

  async triggerAnomalyCheck(payload: {
    companyId: string; eventType: string; metadata?: Record<string, unknown>;
  }): Promise<{ anomalyDetected: boolean; events: SecurityEventDTO[] }> {
    const response = await apiClient.post(`${this.basePath}/security/anomaly-check`, payload);
    return response.data;
  }

  async resolveSecurityEvent(eventId: string): Promise<void> {
    await apiClient.post(`${this.basePath}/security/events/${eventId}/resolve`);
  }

  async getSystemHealth(companyId: string): Promise<{ overall: string; services: SystemHealthDTO[] }> {
    const response = await apiClient.get(`${this.basePath}/health/system`, { params: { companyId } });
    return response.data;
  }

  async getDatabaseHealth(): Promise<{ status: string; responseTimeMs: number; timestamp: string }> {
    const response = await apiClient.get(`${this.basePath}/health/database`);
    return response.data;
  }

  async getServicesHealth(): Promise<SystemHealthDTO[]> {
    const response = await apiClient.get(`${this.basePath}/health/services`);
    return response.data;
  }
}

export const securityService = new SecurityService();
