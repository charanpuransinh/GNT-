// ============================================================================
// M07 PURCHASE MANAGEMENT — Event Handlers
// ============================================================================

import { PURCHASE_EVENTS, EventPayload } from './purchase.events';
import {
  PurchaseInvoiceApprovedEvent,
  PurchaseOrderCreatedEvent,
  PurchaseReturnPostedEvent,
} from '../types/purchase.types';

interface StockService {
  addStock(data: { product_id: string; quantity: number; rate: number; batch_id?: string; reference: string }): Promise<void>;
  deductStock(data: { product_id: string; quantity: number; reference: string }): Promise<void>;
}

interface GSTService {
  calculateInputTax(data: { invoice_id: string; items: Array<{ product_id: string; tax_amount: number; hsn_code?: string }> }): Promise<void>;
  reverseInputTax(data: { return_id: string; items: Array<{ product_id: string; tax_amount: number }> }): Promise<void>;
}

interface LedgerService {
  createPurchaseEntry(data: { invoice_id: string; supplier_id: string; amount: number; tax_amount: number; reference: string }): Promise<void>;
  createPurchaseReturnEntry(data: { return_id: string; supplier_id: string; amount: number; tax_amount: number; reference: string }): Promise<void>;
}

interface EventBus { publish(event: string, payload: unknown): Promise<void>; }

export class PurchaseEventHandlers {
  constructor(
    private stockService: StockService,
    private gstService: GSTService,
    private ledgerService: LedgerService,
    private eventBus: EventBus,
  ) {}

  async handleInvoiceApproved(payload: EventPayload<PurchaseInvoiceApprovedEvent>): Promise<void> {
    if (payload.event !== PURCHASE_EVENTS.INVOICE_APPROVED) throw new Error('Invalid event for invoice approval handler');
  }

  async handleInvoicePosted(payload: EventPayload<PurchaseInvoiceApprovedEvent>): Promise<void> {
    const { invoice_id, items, supplier_id, company_id, total_amount, tax_amount } = payload.payload;
    if (!company_id || !invoice_id || !supplier_id || !items.length) throw new Error('Invalid purchase invoice posted payload');

    for (const item of items) {
      if (item.quantity <= 0 || item.rate < 0) throw new Error(`Invalid invoice item for ${item.product_id}`);
      await this.stockService.addStock({ product_id: item.product_id, quantity: item.quantity, rate: item.rate, reference: `PI-${invoice_id}` });
    }
    await this.gstService.calculateInputTax({
      invoice_id,
      items: items.map(i => ({ product_id: i.product_id, tax_amount: i.tax_amount })),
    });
    await this.ledgerService.createPurchaseEntry({
      invoice_id,
      supplier_id,
      amount: total_amount,
      tax_amount,
      reference: `PI-${invoice_id}`,
    });
  }

  async handleOrderCreated(payload: EventPayload<PurchaseOrderCreatedEvent>): Promise<void> {
    if (!payload.payload.company_id || !payload.payload.po_id) throw new Error('Invalid purchase order created payload');
  }

  async handleReturnPosted(payload: EventPayload<PurchaseReturnPostedEvent>): Promise<void> {
    const { return_id, supplier_id, company_id, total_amount, tax_amount, items } = payload.payload;
    if (!company_id || !return_id || !supplier_id || !items.length) throw new Error('Invalid purchase return posted payload');

    for (const item of items) {
      if (item.quantity <= 0 || item.rate < 0) throw new Error(`Invalid return item for ${item.product_id}`);
      await this.stockService.deductStock({ product_id: item.product_id, quantity: item.quantity, reference: `PR-${return_id}` });
    }
    await this.gstService.reverseInputTax({
      return_id,
      items: items.map(i => ({ product_id: i.product_id, tax_amount: i.tax_amount })),
    });
    await this.ledgerService.createPurchaseReturnEntry({
      return_id,
      supplier_id,
      amount: total_amount,
      tax_amount,
      reference: `PR-${return_id}`,
    });
  }
}

export function createPurchaseEventHandlers(
  stockService: StockService,
  gstService: GSTService,
  ledgerService: LedgerService,
  eventBus: EventBus,
): PurchaseEventHandlers {
  return new PurchaseEventHandlers(stockService, gstService, ledgerService, eventBus);
}
