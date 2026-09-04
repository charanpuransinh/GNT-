// ============================================================================
// M07 PURCHASE MANAGEMENT — Purchase Order Repository (INTERNAL)
// ============================================================================

import { PrismaClient, purchase_order, purchase_order_item, Prisma } from '@prisma/client';
import { CreatePurchaseOrderDTO, UpdatePurchaseOrderDTO, PurchaseOrderQueryDTO } from '../types/purchase.types';

export class PurchaseOrderRepository {
  constructor(private prisma: PrismaClient) {}

  async createPO(data: CreatePurchaseOrderDTO & { total_amount: number; total_tax: number; total_discount: number; net_amount: number }) {
    const { items, ...poData } = data;
    return this.prisma.purchase_order.create({
      data: {
        ...poData,
        status: 'draft',
        items: {
          create: items.map(item => ({
            product_id: item.product_id,
            quantity: new Prisma.Decimal(item.quantity),
            rate: new Prisma.Decimal(item.rate),
            discount_percent: item.discount_percent ? new Prisma.Decimal(item.discount_percent) : null,
            discount_amount: item.discount_amount ? new Prisma.Decimal(item.discount_amount) : null,
            amount: item.amount ? new Prisma.Decimal(item.amount) : null,
            tax_rate: item.tax_rate ? new Prisma.Decimal(item.tax_rate) : null,
            tax_amount: item.tax_amount ? new Prisma.Decimal(item.tax_amount) : null,
            net_amount: item.net_amount ? new Prisma.Decimal(item.net_amount) : null,
          })),
        },
      },
      include: { items: true },
    });
  }

  async getPOs(query: PurchaseOrderQueryDTO) {
    const { company_id, supplier_id, status, page = 1, limit = 20 } = query;

    const where: Prisma.purchase_orderWhereInput = { company_id };
    if (supplier_id) where.supplier_id = supplier_id;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.purchase_order.findMany({
        where,
        include: { items: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.purchase_order.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getPOById(id: string, company_id: string) {
    return this.prisma.purchase_order.findFirst({
      where: { id, company_id },
      include: { items: true, invoices: true, grns: true },
    });
  }

  async updatePO(id: string, company_id: string, data: UpdatePurchaseOrderDTO & { total_amount?: number; total_tax?: number; total_discount?: number; net_amount?: number }) {
    const { items, ...poData } = data;

    return this.prisma.$transaction(async (tx) => {
      // company_id पहले सिर्फ़ parameter था। मालिकाना जाँचे बिना items मिटा दिए
      // जाते थे — यानी दूसरी company का PO भेजने पर उसकी lines पहले ही उड़ जातीं।
      const apna = await tx.purchase_order.findFirst({ where: { id, company_id }, select: { id: true } });
      if (!apna) throw new Error('Purchase order not found');

      if (items && items.length > 0) {
        await tx.purchase_order_item.deleteMany({ where: { purchase_order_id: id } });
      }

      return tx.purchase_order.update({
        where: { id },
        data: {
          ...poData,
          ...(items && items.length > 0 ? {
            items: {
              create: items.map(item => ({
                product_id: item.product_id,
                quantity: new Prisma.Decimal(item.quantity),
                rate: new Prisma.Decimal(item.rate),
                discount_percent: item.discount_percent ? new Prisma.Decimal(item.discount_percent) : null,
                discount_amount: item.discount_amount ? new Prisma.Decimal(item.discount_amount) : null,
                amount: item.amount ? new Prisma.Decimal(item.amount) : null,
                tax_rate: item.tax_rate ? new Prisma.Decimal(item.tax_rate) : null,
                tax_amount: item.tax_amount ? new Prisma.Decimal(item.tax_amount) : null,
                net_amount: item.net_amount ? new Prisma.Decimal(item.net_amount) : null,
              })),
            },
          } : {}),
        },
        include: { items: true },
      });
    });
  }

  async sendPO(id: string, company_id: string) {
    return this.prisma.purchase_order.updateMany({
      where: { id, company_id, status: 'draft' },
      data: { status: 'sent' },
    });
  }

  async receivePO(id: string, company_id: string, receivedQuantities: Record<string, number>) {
    return this.prisma.$transaction(async (tx) => {
      const po = await tx.purchase_order.findFirst({
        where: { id, company_id },
        include: { items: true },
      });

      if (!po) throw new Error('Purchase order not found');
      if (Object.keys(receivedQuantities).length === 0) throw new Error('At least one received quantity is required');

      for (const [itemId, qty] of Object.entries(receivedQuantities)) {
        if (!Number.isFinite(qty) || qty <= 0) throw new Error(`Invalid received quantity for item ${itemId}`);
        const item = po.items.find(candidate => candidate.id === itemId);
        if (!item) throw new Error(`Purchase order item ${itemId} does not belong to this order`);
        const newReceived = new Prisma.Decimal(item.received_qty).plus(new Prisma.Decimal(qty));
        if (newReceived.gt(item.quantity)) throw new Error(`Received quantity exceeds ordered quantity for item ${itemId}`);
        await tx.purchase_order_item.update({
          where: { id: itemId },
          data: { received_qty: newReceived },
        });
        item.received_qty = newReceived;
      }

      const allReceived = po.items.every(item => new Prisma.Decimal(item.received_qty).gte(item.quantity));

      return tx.purchase_order.update({
        where: { id },
        data: { status: allReceived ? 'received' : 'partial' },
      });
    });
  }

  async cancelPO(id: string, company_id: string) {
    return this.prisma.purchase_order.updateMany({
      where: { id, company_id, status: { not: 'received' } },
      data: { status: 'cancelled' },
    });
  }

  async createGRN(data: { company_id: string; purchase_order_id: string; grn_number?: string; grn_date: Date; received_by?: string; status: string }) {
    return this.prisma.grn.create({
      data: {
        ...data,
        status: data.status as any,
      },
    });
  }
}
