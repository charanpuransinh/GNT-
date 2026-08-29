import { PrismaClient, Prisma } from '@prisma/client';
import { SecurityEventEntry, SecurityEventFilters } from '../types/security.types';

export class SecurityRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createSecurityEvent(data: Omit<SecurityEventEntry, 'id' | 'createdAt'>): Promise<SecurityEventEntry> {
    const event = await this.prisma.securityEvent.create({
      data: {
        companyId: data.companyId,
        eventType: data.eventType,
        severity: data.severity,
        description: data.description,
        metadata: data.metadata as Prisma.InputJsonValue,
      },
    });
    return event as SecurityEventEntry;
  }

  async getSecurityEvents(filters: SecurityEventFilters): Promise<SecurityEventEntry[]> {
    const events = await this.prisma.securityEvent.findMany({
      where: {
        companyId: filters.companyId,
        ...(filters.severity && { severity: filters.severity }),
        ...(filters.eventType && { eventType: filters.eventType }),
        ...(filters.resolved !== undefined ? {
          resolvedAt: filters.resolved ? { not: null } : null,
        } : {}),
        ...(filters.startDate || filters.endDate ? {
          createdAt: {
            ...(filters.startDate && { gte: filters.startDate }),
            ...(filters.endDate && { lte: filters.endDate }),
          },
        } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return events as SecurityEventEntry[];
  }

  async resolveEvent(eventId: string): Promise<void> {
    await this.prisma.securityEvent.update({
      where: { id: eventId },
      data: { resolvedAt: new Date() },
    });
  }

  async getRecentFailedAttempts(companyId: string, userId: string, minutes: number = 30): Promise<number> {
    const since = new Date(Date.now() - minutes * 60 * 1000);
    return this.prisma.loginHistory.count({
      where: { companyId, userId, status: 'failed', createdAt: { gte: since } },
    });
  }

  async getEventsByIp(companyId: string, ipAddress: string, minutes: number = 60): Promise<number> {
    const since = new Date(Date.now() - minutes * 60 * 1000);
    return this.prisma.securityEvent.count({
      where: {
        companyId,
        createdAt: { gte: since },
        metadata: { path: ['ipAddress'], equals: ipAddress },
      },
    });
  }
}
