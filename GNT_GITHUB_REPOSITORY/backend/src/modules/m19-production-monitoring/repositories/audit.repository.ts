import { PrismaClient, Prisma } from '@prisma/client';
import { AuditLogEntry, LoginHistoryEntry, AuditQueryFilters } from '../types/security.types';

export class AuditRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createAuditLog(data: Omit<AuditLogEntry, 'id' | 'createdAt'>): Promise<AuditLogEntry> {
    const log = await this.prisma.auditLog.create({
      data: {
        companyId: data.companyId,
        userId: data.userId,
        action: data.action,
        module: data.module,
        resource: data.resource,
        resourceId: data.resourceId,
        beforeData: data.beforeData as Prisma.InputJsonValue,
        afterData: data.afterData as Prisma.InputJsonValue,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
    return log as AuditLogEntry;
  }

  async queryAuditLogs(filters: AuditQueryFilters): Promise<{ data: AuditLogEntry[]; total: number }> {
    // सुरक्षा (P0): companyId undefined हो तो Prisma उस शर्त को छोड़ देता है और
    // हर कंपनी का audit trail लौट आता है। इसलिए यहीं रोक दो।
    if (!filters.companyId) {
      throw new Error('companyId ज़रूरी है — tenant scope के बिना audit log नहीं मिलेगा');
    }

    const where: Prisma.AuditLogWhereInput = {
      companyId: filters.companyId,
      ...(filters.module && { module: filters.module }),
      ...(filters.userId && { userId: filters.userId }),
      ...(filters.action && { action: filters.action }),
      ...(filters.resource && { resource: filters.resource }),
      ...(filters.startDate || filters.endDate ? {
        createdAt: {
          ...(filters.startDate && { gte: filters.startDate }),
          ...(filters.endDate && { lte: filters.endDate }),
        },
      } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: ((filters.page ?? 1) - 1) * (filters.limit ?? 20),
        take: filters.limit ?? 20,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data: data as AuditLogEntry[], total };
  }

  async createLoginHistory(data: Omit<LoginHistoryEntry, 'id' | 'createdAt'>): Promise<LoginHistoryEntry> {
    const entry = await this.prisma.loginHistory.create({
      data: {
        companyId: data.companyId,
        userId: data.userId,
        ipAddress: data.ipAddress,
        deviceFingerprint: data.deviceFingerprint,
        location: data.location,
        status: data.status,
        attemptCount: data.attemptCount,
      },
    });
    return entry as LoginHistoryEntry;
  }

  async getLoginHistory(companyId: string, userId?: string, status?: 'success' | 'failed'): Promise<LoginHistoryEntry[]> {
    const logs = await this.prisma.loginHistory.findMany({
      where: { companyId, ...(userId && { userId }), ...(status && { status }) },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return logs as LoginHistoryEntry[];
  }

  async incrementLoginAttempt(companyId: string, userId: string, ipAddress: string): Promise<void> {
    const recent = await this.prisma.loginHistory.findFirst({
      where: { companyId, userId, ipAddress, status: 'failed' },
      orderBy: { createdAt: 'desc' },
    });

    if (recent) {
      await this.prisma.loginHistory.update({
        where: { id: recent.id },
        data: { attemptCount: { increment: 1 } },
      });
    }
  }

  async deleteAuditLog(): Promise<never> {
    throw new Error('ILLEGAL_OPERATION: audit_log is APPEND ONLY');
  }

  async updateAuditLog(): Promise<never> {
    throw new Error('ILLEGAL_OPERATION: audit_log is APPEND ONLY');
  }
}
