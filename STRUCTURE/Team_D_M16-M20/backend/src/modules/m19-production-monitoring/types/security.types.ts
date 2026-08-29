export interface AuditLogEntry {
  id: string; companyId: string; userId?: string | null;
  action: string; module: string; resource: string; resourceId?: string | null;
  beforeData?: Record<string, unknown> | null;
  afterData?: Record<string, unknown> | null;
  ipAddress?: string | null; userAgent?: string | null; createdAt: Date;
}

export interface LoginHistoryEntry {
  id: string; companyId: string; userId: string; ipAddress: string;
  deviceFingerprint?: string | null; location?: string | null;
  status: 'success' | 'failed'; attemptCount: number; createdAt: Date;
}

export interface SecurityEventEntry {
  id: string; companyId: string; eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string; metadata?: Record<string, unknown> | null;
  resolvedAt?: Date | null; createdAt: Date;
}

export interface SystemHealthEntry {
  id: string; companyId: string; serviceName: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'down';
  responseTimeMs?: number | null; lastCheckedAt: Date; errorCount: number;
}

export interface AuditQueryFilters {
  companyId: string; module?: string; userId?: string; action?: string;
  resource?: string; startDate?: Date; endDate?: Date; page?: number; limit?: number;
}

export interface SecurityEventFilters {
  companyId: string; severity?: 'low' | 'medium' | 'high' | 'critical';
  eventType?: string; resolved?: boolean; startDate?: Date; endDate?: Date;
}

export interface AnomalyCheckInput {
  companyId: string; eventType: string; metadata?: Record<string, unknown>;
  ipAddress?: string; userId?: string;
}

export interface LogActionInput {
  companyId: string; userId?: string; action: string; module: string;
  resource: string; resourceId?: string; beforeData?: Record<string, unknown>;
  afterData?: Record<string, unknown>; ipAddress?: string; userAgent?: string;
}
