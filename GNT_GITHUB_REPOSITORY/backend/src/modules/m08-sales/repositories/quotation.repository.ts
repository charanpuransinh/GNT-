/**
 * M08 SALES & BILLING — Quotation Repository (INTERNAL)
 * Module: m08-sales | Team: B4-BRAVO
 */

import { PrismaClient, Quotation, QuotationItem, Prisma } from '@prisma/client';
import { QuotationQueryParams } from '../types/sales.types';

const prisma = new PrismaClient();

export class QuotationRepository {
  // ─── CREATE ───
  async createQuotation(data: Prisma.QuotationCreateInput & { items: Prisma.QuotationItemCreateManyQuotationInput[] }): Promise<Quotation> {
    return prisma.quotation.create({
      data: {
        ...data,
        items: { createMany: { data: data.items } },
      },
      include: { items: true },
    });
  }

  // ─── READ ───
  async getQuotationById(id: string, companyId: string): Promise<Quotation & { items: QuotationItem[] } | null> {
    return prisma.quotation.findFirst({
      where: { id, companyId },
      include: { items: true },
    }) as any;
  }

  async getQuotations(params: QuotationQueryParams): Promise<{ data: Quotation[]; total: number }> {
    const { companyId, customerId, status, page = 1, limit = 20 } = params;
    const where: Prisma.QuotationWhereInput = { companyId };
    if (customerId) where.customerId = customerId;
    if (status) where.status = status as any;

    const [data, total] = await Promise.all([
      prisma.quotation.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.quotation.count({ where }),
    ]);
    return { data, total };
  }

  // ─── UPDATE ───
  async updateQuotation(id: string, companyId: string, data: Prisma.QuotationUpdateInput): Promise<Quotation> {
    await prisma.quotation.updateMany({ where: { id, companyId }, data });
    return prisma.quotation.findUnique({ where: { id }, include: { items: true } }) as Promise<any>;
  }

  async updateQuotationStatus(id: string, companyId: string, status: string): Promise<Quotation> {
    await prisma.quotation.updateMany({ where: { id, companyId }, data: { status: status as any } });
    return prisma.quotation.findUnique({ where: { id }, include: { items: true } }) as Promise<any>;
  }

  // ─── DELETE ───
  async deleteQuotation(id: string, companyId: string): Promise<void> {
    const result = await prisma.quotation.deleteMany({
      where: { id, companyId, status: { in: ['draft', 'rejected'] } },
    });
    if (result.count === 0) throw new Error('Quotation not found or not deletable');
  }

  // ─── HELPERS ───
  async getNextQuotationNumber(companyId: string, prefix = 'QTN'): Promise<string> {
    const count = await prisma.quotation.count({ where: { companyId } });
    const date = new Date();
    const yy = date.getFullYear().toString().slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    return `${prefix}-${yy}${mm}-${String(count + 1).padStart(5, '0')}`;
  }
}

export const quotationRepository = new QuotationRepository();
