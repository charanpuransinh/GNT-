import { PrismaClient } from '@prisma/client';

export const extendAccountingModels = (prisma: PrismaClient) => {
  return prisma.$extends({
    model: {
      ledger: {
        async getRunningBalance(accountId: string, asOfDate?: Date) {
          return prisma.ledger.findMany({
            where: {
              account_id: accountId,
              ...(asOfDate ? { transaction_date: { lte: asOfDate } } : {}),
            },
            orderBy: { transaction_date: 'asc' },
          });
        },
      },
      voucher: {
        async getUnpostedVouchers(companyId: string) {
          return prisma.voucher.findMany({
            where: { company_id: companyId, status: 'draft' },
            include: { items: true },
          });
        },
      },
    },
  });
};
