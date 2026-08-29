/**
 * M08 SALES & BILLING — Prisma Model Extensions
 * Module: m08-sales | Team: B4-BRAVO
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient().$extends({
  model: {
    salesInvoice: {
      async getWithItems(id: string) {
        return prisma.salesInvoice.findUnique({
          where: { id },
          include: { items: true, salesOrder: true, quotation: true },
        });
      },
    },
    quotation: {
      async getWithItems(id: string) {
        return prisma.quotation.findUnique({
          where: { id },
          include: { items: true },
        });
      },
    },
    salesOrder: {
      async getWithItems(id: string) {
        return prisma.salesOrder.findUnique({
          where: { id },
          include: { items: true, quotation: true },
        });
      },
    },
  },
});

export default prisma;
