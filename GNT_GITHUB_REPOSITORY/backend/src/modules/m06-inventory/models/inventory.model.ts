// GNT M06 — Prisma Model Extensions
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const inventoryPrisma = prisma.$extends({
  model: {
    product_master: {
      async getWithStock(id: string, company_id: string) {
        return prisma.product_master.findFirst({
          where: { id, company_id },
          include: { stock: true, category: true },
        });
      },
    },
    stock_master: {
      async getTotalByProduct(product_id: string, company_id: string) {
        const result = await prisma.stock_master.aggregate({
          where: { product_id, company_id },
          _sum: { quantity: true },
        });
        return result._sum.quantity || 0;
      },
    },
  },
});

export default inventoryPrisma;
