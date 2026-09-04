// ============================================================================
// M07 PURCHASE MANAGEMENT — Purchase Invoice Repository (INTERNAL)
// ============================================================================

import { PrismaClient, purchase_invoice, purchase_invoice_item, Prisma } from '@prisma/client';
import {
  CreatePurchaseInvoiceDTO,
  UpdatePurchaseInvoiceDTO,
  PurchaseInvoiceQueryDTO,
  CreatePurchaseReturnDTO,
} from '../types/purchase.types';

export class PurchaseRepository {
  constructor(private prisma: PrismaClient) {}

  // ─── Purchase Invoice CRUD ───

  async createInvoice(data: CreatePurchaseInvoiceDTO & { total_amount: number; total_tax: number; total_discount: number; net_amount: number; grand_total: number }) {
    const { items, ...invoiceData } = data;
    return this.prisma.purchase_invoice.create({
      data: {
        ...invoiceData,
        status: 'draft',
        items: {
          create: items.map(item => ({
            product_id: item.product_id,
            batch_id: item.batch_id || null,
            quantity: new Prisma.Decimal(item.quantity),
            rate: new Prisma.Decimal(item.rate),
            discount_percent: item.discount_percent ? new Prisma.Decimal(item.discount_percent) : null,
            discount_amount: item.discount_amount ? new Prisma.Decimal(item.discount_amount) : null,
            amount: item.amount ? new Prisma.Decimal(item.amount) : null,
            tax_rate: item.tax_rate ? new Prisma.Decimal(item.tax_rate) : null,
            tax_amount: item.tax_amount ? new Prisma.Decimal(item.tax_amount) : null,
            net_amount: item.net_amount ? new Prisma.Decimal(item.net_amount) : null,
            hsn_code: item.hsn_code || null,
          })),
        },
      },
      include: { items: true },
    });
  }

  async getInvoices(query: PurchaseInvoiceQueryDTO) {
    const { company_id, supplier_id, from_date, to_date, status, page = 1, limit = 20 } = query;

    const where: Prisma.purchase_invoiceWhereInput = { company_id };
    if (supplier_id) where.supplier_id = supplier_id;
    if (status) where.status = status;
    if (from_date || to_date) {
      where.invoice_date = {};
      if (from_date) where.invoice_date.gte = new Date(from_date);
      if (to_date) where.invoice_date.lte = new Date(to_date);
    }

    const [data, total] = await Promise.all([
      this.prisma.purchase_invoice.findMany({
        where,
        include: { items: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.purchase_invoice.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getInvoiceById(id: string, company_id: string) {
    return this.prisma.purchase_invoice.findFirst({
      where: { id, company_id },
      include: { items: true, purchase_order: true },
    });
  }

  async updateInvoice(id: string, company_id: string, data: UpdatePurchaseInvoiceDTO & { total_amount?: number; total_tax?: number; total_discount?: number; net_amount?: number; grand_total?: number }) {
    const { items, ...invoiceData } = data;

    return this.prisma.$transaction(async (tx) => {
      // वही छेद जो PO में था: company_id लिया जाता था, कहीं लगाया नहीं जाता था
      const apna = await tx.purchase_invoice.findFirst({ where: { id, company_id }, select: { id: true } });
      if (!apna) throw new Error('Purchase invoice not found');

      // Delete existing items if new items provided
      if (items && items.length > 0) {
        await tx.purchase_invoice_item.deleteMany({ where: { purchase_invoice_id: id } });
      }

      return tx.purchase_invoice.update({
        where: { id },
        data: {
          ...invoiceData,
          ...(items && items.length > 0 ? {
            items: {
              create: items.map(item => ({
                product_id: item.product_id,
                batch_id: item.batch_id || null,
                quantity: new Prisma.Decimal(item.quantity),
                rate: new Prisma.Decimal(item.rate),
                discount_percent: item.discount_percent ? new Prisma.Decimal(item.discount_percent) : null,
                discount_amount: item.discount_amount ? new Prisma.Decimal(item.discount_amount) : null,
                amount: item.amount ? new Prisma.Decimal(item.amount) : null,
                tax_rate: item.tax_rate ? new Prisma.Decimal(item.tax_rate) : null,
                tax_amount: item.tax_amount ? new Prisma.Decimal(item.tax_amount) : null,
                net_amount: item.net_amount ? new Prisma.Decimal(item.net_amount) : null,
                hsn_code: item.hsn_code || null,
              })),
            },
          } : {}),
        },
        include: { items: true },
      });
    });
  }

  async deleteInvoice(id: string, company_id: string) {
    return this.prisma.purchase_invoice.deleteMany({
      where: { id, company_id, status: 'draft' },
    });
  }

  async approveInvoice(id: string, company_id: string, approved_by: string) {
    return this.prisma.purchase_invoice.updateMany({
      where: { id, company_id, status: 'draft' },
      data: { status: 'approved', approved_by },
    });
  }

  async postInvoice(id: string, company_id: string, posted_by: string) {
    return this.prisma.purchase_invoice.updateMany({
      where: { id, company_id, status: 'approved' },
      data: { status: 'posted', posted_by },
    });
  }

  async cancelInvoice(id: string, company_id: string) {
    return this.prisma.purchase_invoice.updateMany({
      where: { id, company_id },
      data: { status: 'cancelled' },
    });
  }

  async updateOCRData(id: string, company_id: string, ocr_data: unknown, ocr_confidence: number) {
    return this.prisma.purchase_invoice.updateMany({
      where: { id, company_id },
      data: { ocr_data: ocr_data as Prisma.InputJsonValue, ocr_confidence: new Prisma.Decimal(ocr_confidence) },
    });
  }

  // ─── Purchase Return CRUD ───

  async createReturn(data: CreatePurchaseReturnDTO & { total_amount: number; tax_amount: number; net_amount: number }) {
    const { items, ...returnData } = data;
    return this.prisma.purchase_return.create({
      data: {
        ...returnData,
        status: 'draft',
        items: {
          create: items.map(item => ({
            product_id: item.product_id,
            quantity: new Prisma.Decimal(item.quantity),
            rate: new Prisma.Decimal(item.rate),
            amount: item.amount ? new Prisma.Decimal(item.amount) : null,
            tax_amount: item.tax_amount ? new Prisma.Decimal(item.tax_amount) : null,
            net_amount: item.net_amount ? new Prisma.Decimal(item.net_amount) : null,
          })),
        },
      },
      include: { items: true },
    });
  }

  async getReturns(company_id: string, page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      this.prisma.purchase_return.findMany({
        where: { company_id },
        include: { items: true, purchase_invoice: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.purchase_return.count({ where: { company_id } }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getReturnById(id: string, company_id: string) {
    return this.prisma.purchase_return.findFirst({
      where: { id, company_id },
      include: { items: true, purchase_invoice: true },
    });
  }

  async approveReturn(id: string, company_id: string) {
    return this.prisma.purchase_return.updateMany({
      where: { id, company_id, status: 'draft' },
      data: { status: 'approved' },
    });
  }

  async postReturn(id: string, company_id: string) {
    return this.prisma.purchase_return.updateMany({
      where: { id, company_id, status: 'approved' },
      data: { status: 'posted' },
    });
  }
}
