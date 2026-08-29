/**
 * M17 Reporting — Prisma Model Extensions
 * Owner: D4-DELTA
 */
import { Prisma } from '@prisma/client';

export const reportConfigExtension = Prisma.defineExtension({
  model: {
    reportConfig: {
      async findByCompanyAndType(
        this: Prisma.ReportConfigDelegate,
        companyId: string,
        reportType: string
      ) {
        return this.findMany({
          where: { companyId, reportType },
          orderBy: { createdAt: 'desc' },
        });
      },

      async findScheduledReports(
        this: Prisma.ReportConfigDelegate,
        frequency: string
      ) {
        return this.findMany({
          where: {
            schedule: {
              path: ['frequency'],
              equals: frequency,
            },
          },
        });
      },
    },
    reportTemplate: {
      async findByCompanyAndType(
        this: Prisma.ReportTemplateDelegate,
        companyId: string,
        templateType: string
      ) {
        return this.findMany({
          where: { companyId, templateType },
          orderBy: { createdAt: 'desc' },
        });
      },
    },
  },
});

export type ExtendedPrismaClient = Prisma.Client;
