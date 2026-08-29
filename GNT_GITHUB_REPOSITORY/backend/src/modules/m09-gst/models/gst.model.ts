import { PrismaClient } from '@prisma/client';

export const extendGSTModels = (prisma: PrismaClient) => {
  return prisma.$extends({
    model: {
      gst_transaction: {
        async getTaxSummary(companyId: string, fromDate: Date, toDate: Date, taxType: string) {
          return prisma.gst_transaction.groupBy({
            by: ['hsn_code'],
            where: {
              company_id: companyId,
              transaction_date: { gte: fromDate, lte: toDate },
              tax_type: taxType,
            },
            _sum: {
              taxable_amount: true,
              cgst_amount: true,
              sgst_amount: true,
              igst_amount: true,
              cess_amount: true,
            },
          });
        },
      },
    },
  });
};
