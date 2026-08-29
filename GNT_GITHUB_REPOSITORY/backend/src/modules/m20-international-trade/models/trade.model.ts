// GNT M20 — Prisma Model Extensions (trade_job)
// Owner: D4-DELTA

import { Prisma } from '@prisma/client';

export const tradeJobExtensions = Prisma.defineExtension({
  model: {
    trade_job: {
      async getByCompany(ctx: Prisma.TransactionClient, companyId: string, options?: { type?: string; status?: string; page?: number; limit?: number }) {
        const { type, status, page = 1, limit = 20 } = options || {};
        const where: Prisma.trade_jobWhereInput = { company_id: companyId };
        if (type) where.type = type as any;
        if (status) where.status = status as any;

        const [data, total] = await Promise.all([
          ctx.trade_job.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { created_at: 'desc' },
            include: { hsn: true, documents: true },
          }),
          ctx.trade_job.count({ where }),
        ]);

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
      },

      async getById(ctx: Prisma.TransactionClient, id: string, companyId: string) {
        return ctx.trade_job.findFirst({
          where: { id, company_id: companyId },
          include: { hsn: true, documents: true },
        });
      },
    },
  },
});
