// M14 — Job Service
// Lock: LOCK_08_JOB_SERVICE
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class JobService {
  async getDashboard(tenantId: string) {
    const [importStats, exportStats, recentImports, recentExports] = await Promise.all([
      prisma.importJob.groupBy({ by: ['status'], where: { tenantId }, _count: { status: true } }),
      prisma.exportJob.groupBy({ by: ['status'], where: { tenantId }, _count: { status: true } }),
      prisma.importJob.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' }, take: 5 }),
      prisma.exportJob.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' }, take: 5 }),
    ]);

    return {
      importStats: importStats.reduce((acc, s) => ({ ...acc, [s.status]: s._count.status }), {}),
      exportStats: exportStats.reduce((acc, s) => ({ ...acc, [s.status]: s._count.status }), {}),
      recentImports,
      recentExports,
    };
  }

  async cleanupOldJobs(tenantId: string, olderThanDays = 30) {
    const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    const [imp, exp] = await Promise.all([
      prisma.importJob.deleteMany({ where: { tenantId, createdAt: { lt: cutoff }, status: { in: ['COMPLETED', 'FAILED', 'CANCELLED'] } } }),
      prisma.exportJob.deleteMany({ where: { tenantId, createdAt: { lt: cutoff }, status: { in: ['COMPLETED', 'FAILED', 'CANCELLED'] } } }),
    ]);
    return { deletedImports: imp.count, deletedExports: exp.count };
  }
}
