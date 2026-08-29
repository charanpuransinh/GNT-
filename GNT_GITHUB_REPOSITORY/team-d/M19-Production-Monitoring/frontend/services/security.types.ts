export interface AuditLogDTO {
  id: string; companyId: string; userId: string | null;
  action: string; module: string; resource: string; resourceId: string | null;
  beforeData: Record<string, unknown> | null;
  afterData: Record<string, unknown> | null;
  ipAddress: string | null; userAgent: string | null; createdAt: string;
}

export interface LoginHistoryDTO {
  id: string; companyId: string; userId: string; ipAddress: string;
  deviceFingerprint: string | null; location: string | null;
  status: 'success' | 'failed'; attemptCount: number; createdAt: string;
}

export interface SecurityEventDTO {
  id: string; companyId: string; eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string; metadata: Record<string, unknown> | null;
  resolvedAt: string | null; createdAt: string;
}

export interface SystemHealthDTO {
  id: string; companyId: string; serviceName: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'down';
  responseTimeMs: number | null; lastCheckedAt: string; errorCount: number;
}

export interface PaginatedResponse<T> {
  data: T[]; total: number; page: number; limit: number;
}
