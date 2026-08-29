/**
 * M08 SALES & BILLING — Sales Invoice Repository (INTERNAL)
 * Module: m08-sales | Team: B4-BRAVO
 * RULE: INTERNAL ONLY — No direct access from other modules
 */

import { PrismaClient, SalesInvoice, SalesInvoiceItem, Prisma } from '@prisma/client';
import { InvoiceQueryParams } from '../types/sales.types';

const prisma = new PrismaClient();

export class SalesRepository {
  // ─── CREATE ───
  async createInvoice(data: Prisma.SalesInvoiceCreateInput & { items: Prisma.SalesInvoiceItemCreateManySalesInvoiceInput[] }): Promise<SalesInvoice> {
    return prisma.salesInvoice.create({
      data: {
        ...data,
        items: {
          createMany: {
            data: data.items,
          },
        },
      },
      include: { items: true },
    });
  }

  // ─── READ ───
  async getInvoiceById(id: string, companyId: string): Promise<SalesInvoice & { items: SalesInvoiceItem[] } | null> {
    return prisma.salesInvoice.findFirst({
      where: { id, companyId },
      include: { items: true, salesOrder: true, quotation: true },
    }) as any;
  }

  async getInvoices(params: InvoiceQueryParams): Promise<{ data: SalesInvoice[]; total: number }> {
    const { companyId, customerId, fromDate, toDate, status, paymentStatus, page = 1, limit = 20 } = params;
    const where: Prisma.SalesInvoiceWhereInput = { companyId };

    if (customerId) where.customerId = customerId;
    if (status) where.status = status as any;
    if (paymentStatus) where.paymentStatus = paymentStatus as any;
    if (fromDate || toDate) {
      where.invoiceDate = {};
      if (fromDate) (where.invoiceDate as any).gte = new Date(fromDate);
      if (toDate) (where.invoiceDate as any).lte = new Date(toDate);
    }

    const [data, total] = await Promise.all([
      prisma.salesInvoice.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { items: { take: 0 } },
      }),
      prisma.salesInvoice.count({ where }),
    ]);

    return { data, total };
  }

  async getInvoiceByNumber(invoiceNumber: string, companyId: string): Promise<SalesInvoice | null> {
    return prisma.salesInvoice.findFirst({
      where: { invoiceNumber, companyId },
    });
  }

  // ─── UPDATE ───
  async updateInvoice(id: string, companyId: string, data: Prisma.SalesInvoiceUpdateInput): Promise<SalesInvoice> {
    return prisma.salesInvoice.updateMany({
      where: { id, companyId, status: 'draft' },
      data,
    }).then((result) => {
      if (result.count === 0) throw new Error('Invoice not found or not in draft status');
      return prisma.salesInvoice.findUnique({ where: { id }, include: { items: true } }) as Promise<any>;
    });
  }

  async updateInvoiceStatus(id: string, companyId: string, status: string, extra?: Record<string, any>): Promise<SalesInvoice> {
    const updateData: any = { status, ...extra };
    await prisma.salesInvoice.updateMany({
      where: { id, companyId },
      data: updateData,
    });
    return prisma.salesInvoice.findUnique({ where: { id }, include: { items: true } }) as Promise<any>;
  }

  async updatePaymentStatus(id: string, companyId: string, paymentStatus: string, amountPaid: number): Promise<SalesInvoice> {
    await prisma.salesInvoice.updateMany({
      where: { id, companyId },
      data: { paymentStatus: paymentStatus as any, amountPaid },
    });
    return prisma.salesInvoice.findUnique({ where: { id }, include: { items: true } }) as Promise<any>;
  }

  // ─── DELETE ───
  async deleteInvoice(id: string, companyId: string): Promise<void> {
    const result = await prisma.salesInvoice.deleteMany({
      where: { id, companyId, status: 'draft' },
    });
    if (result.count === 0) throw new Error('Invoice not found or not deletable');
  }

  // ─── HELPERS ───
  async getNextInvoiceNumber(companyId: string, prefix = 'INV'): Promise<string> {
    const count = await prisma.salesInvoice.count({ where: { companyId } });
    const date = new Date();
    const yy = date.getFullYear().toString().slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    return `${prefix}-${yy}${mm}-${String(count + 1).padStart(5, '0')}`;
  }

  async getInvoiceItems(invoiceId: string): Promise<SalesInvoiceItem[]> {
    return prisma.salesInvoiceItem.findMany({ where: { salesInvoiceId: invoiceId } });
  }
}

export const salesRepository = new SalesRepository();
