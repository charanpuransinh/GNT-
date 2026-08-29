// M15 Sync Module — Sync Repository
// GNT Team C | Modular Monolith Architecture

import { PrismaClient } from '@prisma/client';

export class SyncRepository {
  constructor(private prisma: PrismaClient) {}

  // All sync operations are handled via Prisma client directly in services
  // This repository exists for future abstraction and complex queries

  async getJobWithLogs(tenantId: string, jobId: string) {
    return this.prisma.syncJob.findFirst({
      where: { id: jobId, tenantId },
      include: {
        syncLogs: { orderBy: { createdAt: 'desc' }, take: 10 },
        syncQueue: { where: { status: { in: ['pending', 'processing'] } } }
      }
    });
  }

  async getActiveJobs(tenantId: string) {
    return this.prisma.syncJob.findMany({
      where: { tenantId, isActive: true },
      orderBy: { nextRunAt: 'asc' }
    });
  }

  async getJobsByCron(tenantId: string) {
    return this.prisma.syncJob.findMany({
      where: { tenantId, isActive: true, cronExpression: { not: null } }
    });
  }
}
