// GNT M20 — Prisma Model Extensions (hsn_master)
// Owner: D4-DELTA

import { Prisma } from '@prisma/client';

export const hsnMasterExtensions = Prisma.defineExtension({
  model: {
    hsn_master: {
      async search(ctx: Prisma.TransactionClient, query: string, limit: number = 20) {
        return ctx.hsn_master.findMany({
          where: {
            is_active: true,
            OR: [
              { code: { contains: query } },
              { description: { contains: query, mode: 'insensitive' } },
              { chapter: { contains: query } },
              { heading: { contains: query } },
            ],
          },
          take: limit,
          orderBy: { code: 'asc' },
        });
      },

      async getByCode(ctx: Prisma.TransactionClient, code: string) {
        return ctx.hsn_master.findUnique({
          where: { code },
        });
      },
    },
  },
});
