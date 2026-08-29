import { AuditRepository } from '../repositories/audit.repository';
import { LogActionInput, AuditQueryFilters, AuditLogEntry, LoginHistoryEntry } from '../types/security.types';

export class AuditService {
  constructor(private readonly auditRepo: AuditRepository) {}

  async logAction(input: LogActionInput): Promise<AuditLogEntry> {
    return this.auditRepo.createAuditLog({
      companyId: input.companyId,
      userId: input.userId ?? null,
      action: input.action,
      module: input.module,
      resource: input.resource,
      resourceId: input.resourceId ?? null,
      beforeData: input.beforeData ?? null,
      afterData: input.afterData ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    });
  }

  async queryAuditLogs(filters: AuditQueryFilters): Promise<{ data: AuditLogEntry[]; total: number }> {
    return this.auditRepo.queryAuditLogs(filters);
  }

  async getLoginHistory(companyId: string, userId?: string, status?: 'success' | 'failed'): Promise<LoginHistoryEntry[]> {
    return this.auditRepo.getLoginHistory(companyId, userId, status);
  }

  async recordLoginSuccess(companyId: string, userId: string, ipAddress: string, metadata: Record<string, unknown> = {}): Promise<void> {
    await this.auditRepo.createLoginHistory({
      companyId, userId, ipAddress,
      deviceFingerprint: (metadata.deviceFingerprint as string) ?? null,
      location: (metadata.location as string) ?? null,
      status: 'success', attemptCount: 1,
    });
  }

  async recordLoginFailed(companyId: string, userId: string, ipAddress: string, metadata: Record<string, unknown> = {}): Promise<void> {
    await this.auditRepo.createLoginHistory({
      companyId, userId, ipAddress,
      deviceFingerprint: (metadata.deviceFingerprint as string) ?? null,
      location: (metadata.location as string) ?? null,
      status: 'failed', attemptCount: 1,
    });
  }
}
