// ============================================================================
// M07 PURCHASE MANAGEMENT — PO Service (Purchase Order Logic)
// ============================================================================

import { PrismaClient } from '@prisma/client';
import { PurchaseOrderRepository } from '../repositories/po.repository';
import { calculatePOTotals } from './purchase.internal';
import { PurchaseEventHandlers } from '../events/purchase.handlers';
import { PURCHASE_EVENTS } from '../events/purchase.events';
import {
  CreatePurchaseOrderDTO,
  UpdatePurchaseOrderDTO,
  PurchaseOrderQueryDTO,
  PurchaseOrderCreatedEvent,
} from '../types/purchase.types';

export class PurchaseOrderService {
  private repository: PurchaseOrderRepository;

  constructor(
    private prisma: PrismaClient,
    private eventHandlers: PurchaseEventHandlers,
    private eventBus: { publish: (event: string, payload: unknown) => Promise<void> },
  ) {
    this.repository = new PurchaseOrderRepository(prisma);
  }

  async createPO(dto: CreatePurchaseOrderDTO) {
    const calc = calculatePOTotals(dto.items);

    const enrichedItems = dto.items.map((item, idx) => ({
      ...item,
      amount: calc.total_amount / dto.items.length, // Will be recalculated properly
      discount_amount: item.discount_amount || 0,
      tax_amount: item.tax_amount || 0,
      net_amount: item.net_amount || 0,
    }));

    // Recalculate per item properly
    let runningTotal = 0;
    let runningDiscount = 0;
    let runningTax = 0;
    let runningNet = 0;

    const finalItems = dto.items.map(item => {
      const qty = item.quantity;
      const rate = item.rate;
      const discountPercent = item.discount_percent || 0;
      const taxRate = item.tax_rate || 0;
      const gross = qty * rate;
      const discount = item.discount_amount || (gross * discountPercent / 100);
      const afterDiscount = gross - discount;
      const tax = afterDiscount * taxRate / 100;
      const net = afterDiscount + tax;

      runningTotal += gross;
      runningDiscount += discount;
      runningTax += tax;
      runningNet += net;

      return {
        ...item,
        amount: parseFloat(gross.toFixed(4)),
        discount_amount: parseFloat(discount.toFixed(4)),
        tax_amount: parseFloat(tax.toFixed(4)),
        net_amount: parseFloat(net.toFixed(4)),
      };
    });

    const po = await this.repository.createPO({
      ...dto,
      items: finalItems,
      total_amount: parseFloat(runningTotal.toFixed(4)),
      total_discount: parseFloat(runningDiscount.toFixed(4)),
      total_tax: parseFloat(runningTax.toFixed(4)),
      net_amount: parseFloat(runningNet.toFixed(4)),
    });

    // Publish event
    const eventPayload: PurchaseOrderCreatedEvent = {
      po_id: po.id,
      supplier_id: po.supplier_id,
      company_id: po.company_id,
      total_amount: Number(po.net_amount) || 0,
      delivery_date: po.delivery_date,
      items: finalItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        rate: item.rate,
      })),
      created_at: po.created_at,
    };

    await this.eventBus.publish(PURCHASE_EVENTS.ORDER_CREATED, eventPayload);
    await this.eventHandlers.handleOrderCreated({
      event: PURCHASE_EVENTS.ORDER_CREATED,
      payload: eventPayload,
      timestamp: new Date(),
      source: 'm07-purchase',
      trace_id: `trace-${Date.now()}`,
    });

    return po;
  }

  async getPOs(query: PurchaseOrderQueryDTO) {
    return this.repository.getPOs(query);
  }

  async getPOById(id: string, company_id: string) {
    const po = await this.repository.getPOById(id, company_id);
    if (!po) throw new Error('Purchase order not found');
    return po;
  }

  async updatePO(id: string, company_id: string, dto: UpdatePurchaseOrderDTO) {
    const existing = await this.repository.getPOById(id, company_id);
    if (!existing) throw new Error('Purchase order not found');
    if (existing.status !== 'draft') throw new Error('Only draft POs can be updated');

    let updateData: any = { ...dto };

    if (dto.items && dto.items.length > 0) {
      let runningTotal = 0;
      let runningDiscount = 0;
      let runningTax = 0;
      let runningNet = 0;

      const finalItems = dto.items.map(item => {
        const qty = item.quantity;
        const rate = item.rate;
        const discountPercent = item.discount_percent || 0;
        const taxRate = item.tax_rate || 0;
        const gross = qty * rate;
        const discount = item.discount_amount || (gross * discountPercent / 100);
        const afterDiscount = gross - discount;
        const tax = afterDiscount * taxRate / 100;
        const net = afterDiscount + tax;

        runningTotal += gross;
        runningDiscount += discount;
        runningTax += tax;
        runningNet += net;

        return {
          ...item,
          amount: parseFloat(gross.toFixed(4)),
          discount_amount: parseFloat(discount.toFixed(4)),
          tax_amount: parseFloat(tax.toFixed(4)),
          net_amount: parseFloat(net.toFixed(4)),
        };
      });

      updateData = {
        ...dto,
        items: finalItems,
        total_amount: parseFloat(runningTotal.toFixed(4)),
        total_discount: parseFloat(runningDiscount.toFixed(4)),
        total_tax: parseFloat(runningTax.toFixed(4)),
        net_amount: parseFloat(runningNet.toFixed(4)),
      };
    }

    return this.repository.updatePO(id, company_id, updateData);
  }

  async sendPO(id: string, company_id: string) {
    const existing = await this.repository.getPOById(id, company_id);
    if (!existing) throw new Error('Purchase order not found');
    if (existing.status !== 'draft') throw new Error('Only draft POs can be sent');

    const result = await this.repository.sendPO(id, company_id);
    if (result.count === 0) throw new Error('Failed to send PO');

    await this.eventBus.publish(PURCHASE_EVENTS.ORDER_SENT, { po_id: id, company_id, sent_at: new Date() });
    return { success: true, message: 'Purchase order sent to supplier' };
  }

  async receivePO(id: string, company_id: string, receivedQuantities: Record<string, number>) {
    const existing = await this.repository.getPOById(id, company_id);
    if (!existing) throw new Error('Purchase order not found');
    if (!['sent', 'partial'].includes(existing.status)) {
      throw new Error('PO must be sent or partially received before receiving');
    }

    const result = await this.repository.receivePO(id, company_id, receivedQuantities);

    await this.eventBus.publish(PURCHASE_EVENTS.ORDER_RECEIVED, { 
      po_id: id, 
      company_id, 
      received_quantities: receivedQuantities,
      received_at: new Date(),
    });

    return { success: true, message: 'Purchase order received', status: result.status };
  }

  async cancelPO(id: string, company_id: string) {
    const existing = await this.repository.getPOById(id, company_id);
    if (!existing) throw new Error('Purchase order not found');
    if (existing.status === 'received') throw new Error('Received POs cannot be cancelled');

    const result = await this.repository.cancelPO(id, company_id);
    if (result.count === 0) throw new Error('Failed to cancel PO');
    return { success: true, message: 'Purchase order cancelled' };
  }

  async convertPOToInvoice(id: string, company_id: string, userId: string) {
    const po = await this.repository.getPOById(id, company_id);
    if (!po) throw new Error('Purchase order not found');
    if (!['sent', 'partial', 'received'].includes(po.status)) {
      throw new Error('PO must be sent before converting to invoice');
    }

    // Convert PO items to invoice items
    const invoiceItems = po.items.map(item => ({
      product_id: item.product_id,
      quantity: Number(item.quantity),
      rate: Number(item.rate),
      discount_percent: item.discount_percent ? Number(item.discount_percent) : undefined,
      discount_amount: item.discount_amount ? Number(item.discount_amount) : undefined,
      tax_rate: item.tax_rate ? Number(item.tax_rate) : undefined,
      hsn_code: undefined,
    }));

    return {
      po_id: po.id,
      supplier_id: po.supplier_id,
      branch_id: po.branch_id,
      items: invoiceItems,
      notes: `Converted from PO ${po.po_number}`,
      created_by: userId,
    };
  }
}
