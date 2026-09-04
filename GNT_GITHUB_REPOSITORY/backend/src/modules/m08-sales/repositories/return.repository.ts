/**
 * M08 SALES & BILLING — Sales Return Repository (INTERNAL)
 * Module: m08-sales | Team: B4-BRAVO
 */

import { PrismaClient, SalesReturn, SalesReturnItem, ReturnStatus, Prisma } from '@prisma/client';
import { ReturnQueryParams } from '../types/sales.types';

const prisma = new PrismaClient();

export class ReturnRepository {
  // ─── CREATE ───
  async createReturn(data: Prisma.SalesReturnCreateInput & { items: Prisma.SalesReturnItemCreateManySalesReturnInput[] }): Promise<SalesReturn> {
    return prisma.salesReturn.create({
      data: {
        ...data,
        items: { createMany: { data: data.items } },
      },
      include: { items: true },
    });
  }

  // ─── READ ───
  async getReturnById(id: string, companyId: string): Promise<SalesReturn & { items: SalesReturnItem[] } | null> {
    return prisma.salesReturn.findFirst({
      where: { id, companyId },
      include: { items: true, salesInvoice: true },
    }) as any;
  }

  async getReturns(params: ReturnQueryParams): Promise<{ data: SalesReturn[]; total: number }> {
    const { companyId, customerId, status, page = 1, limit = 20 } = params;
    const where: Prisma.SalesReturnWhereInput = { companyId };
    if (customerId) where.customerId = customerId;
    if (status) where.status = status as any;

    const [data, total] = await Promise.all([
      prisma.salesReturn.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.salesReturn.count({ where }),
    ]);
    return { data, total };
  }

  // ─── UPDATE ───
  // वही सुधार जो quotation में — ग़लत status अब compile पर ही रुकेगा
  async updateReturnStatus(id: string, companyId: string, status: ReturnStatus): Promise<SalesReturn> {
    await prisma.salesReturn.updateMany({ where: { id, companyId }, data: { status } });
    return prisma.salesReturn.findUnique({ where: { id }, include: { items: true } }) as Promise<any>;
  }

  // ─── HELPERS ───
  async getNextReturnNumber(companyId: string, prefix = 'RET'): Promise<string> {
    const count = await prisma.salesReturn.count({ where: { companyId } });
    const date = new Date();
    const yy = date.getFullYear().toString().slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    return `${prefix}-${yy}${mm}-${String(count + 1).padStart(5, '0')}`;
  }
}

export const returnRepository = new ReturnRepository();
