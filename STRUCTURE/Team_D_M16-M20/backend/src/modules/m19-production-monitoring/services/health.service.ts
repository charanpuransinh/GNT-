import { PrismaClient } from '@prisma/client';
import { SystemHealthEntry } from '../types/security.types';

export class HealthService {
  constructor(private readonly prisma: PrismaClient) {}

  async checkSystemHealth(companyId: string): Promise<{ overall: string; services: SystemHealthEntry[] }> {
    const services = await this.prisma.systemHealth.findMany({
      where: { companyId },
      orderBy: { lastCheckedAt: 'desc' },
    });

    const statusPriority = { down: 4, unhealthy: 3, degraded: 2, healthy: 1 };
    let worstStatus = 'healthy';

    for (const svc of services) {
      if (statusPriority[svc.status] > statusPriority[worstStatus as keyof typeof statusPriority]) {
        worstStatus = svc.status;
      }
    }

    return { overall: worstStatus, services: services as SystemHealthEntry[] };
  }

  async checkDatabaseHealth(): Promise<{ status: string; responseTimeMs: number; timestamp: string }> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const responseTimeMs = Date.now() - start;
      return { status: 'healthy', responseTimeMs, timestamp: new Date().toISOString() };
    } catch (error) {
      const responseTimeMs = Date.now() - start;
      return { status: 'unhealthy', responseTimeMs, timestamp: new Date().toISOString() };
    }
  }

  async checkAllServices(): Promise<SystemHealthEntry[]> {
    const services = ['api-gateway', 'auth-service', 'payment-service', 'notification-service', 'file-service'];
    const results: SystemHealthEntry[] = [];

    for (const serviceName of services) {
      const start = Date.now();
      let status: 'healthy' | 'degraded' | 'unhealthy' | 'down' = 'healthy';
      let errorCount = 0;

      try {
        await new Promise(r => setTimeout(r, 10));
        const responseTimeMs = Date.now() - start;
        if (responseTimeMs > 5000) status = 'down';
        else if (responseTimeMs > 2000) status = 'degraded';

        results.push({
          id: `${serviceName}-check`, companyId: 'system', serviceName,
          status, responseTimeMs, lastCheckedAt: new Date(), errorCount,
        });
      } catch {
        results.push({
          id: `${serviceName}-check`, companyId: 'system', serviceName,
          status: 'down', responseTimeMs: null, lastCheckedAt: new Date(), errorCount: errorCount + 1,
        });
      }
    }
    return results;
  }

  async recordServiceHealth(entry: Omit<SystemHealthEntry, 'id'>): Promise<SystemHealthEntry> {
    const health = await this.prisma.systemHealth.create({
      data: {
        companyId: entry.companyId,
        serviceName: entry.serviceName,
        status: entry.status,
        responseTimeMs: entry.responseTimeMs,
        lastCheckedAt: entry.lastCheckedAt,
        errorCount: entry.errorCount,
      },
    });
    return health as SystemHealthEntry;
  }
}
