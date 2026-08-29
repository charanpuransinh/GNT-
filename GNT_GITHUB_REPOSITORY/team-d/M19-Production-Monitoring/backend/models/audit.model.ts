import { PrismaClient } from '@prisma/client';

export const auditModelExtensions = (prisma: PrismaClient) => {
  return prisma.$extends({
    model: {
      auditLog: {
        async findByCompany(companyId: string, opts: { skip?: number; take?: number } = {}) {
          return prisma.auditLog.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
            ...opts,
          });
        },
      },
      loginHistory: {
        async findRecentByUser(userId: string, limit: number = 50) {
          return prisma.loginHistory.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
          });
        },
      },
      securityEvent: {
        async findUnresolvedCritical(companyId: string) {
          return prisma.securityEvent.findMany({
            where: { companyId, severity: 'critical', resolvedAt: null },
            orderBy: { createdAt: 'desc' },
          });
        },
      },
    },
  });
};
