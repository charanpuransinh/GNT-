/**
 * M08 SALES & BILLING — Event Handlers
 * Module: m08-sales | Team: B4-BRAVO
 * Handles: sales.invoice.created, sales.quotation.converted, sales.return.created, payment.received
 */

import { eventBus } from '../../../core/event-bus';
import { SALES_EVENTS } from './sales.events';
import { salesService } from '../services/sales.service';
import {
  SalesInvoiceCreatedEvent,
  SalesQuotationConvertedEvent,
  SalesReturnCreatedEvent,
  PaymentReceivedEvent,
} from '../types/sales.types';

export function registerSalesEventHandlers() {
  // ─── sales.invoice.created ───
  eventBus.subscribe(SALES_EVENTS.INVOICE_CREATED, async (payload: SalesInvoiceCreatedEvent) => {
    console.log(`[M08] Invoice created: ${payload.invoiceId}, Total: ${payload.grandTotal}`);
    try {
    } catch (e) {
      console.error('[M08] Notification failed:', e);
    }
  });

  // ─── sales.quotation.converted ───
  eventBus.subscribe(SALES_EVENTS.QUOTATION_CONVERTED, async (payload: SalesQuotationConvertedEvent) => {
    console.log(`[M08] Quotation ${payload.quotationId} converted to Order ${payload.orderId}`);
  });

  // ─── sales.return.created ───
  eventBus.subscribe(SALES_EVENTS.RETURN_CREATED, async (payload: SalesReturnCreatedEvent) => {
    console.log(`[M08] Return created: ${payload.returnId} for Invoice ${payload.invoiceId}`);
  });

  // ─── payment.received (from M11) ───
  eventBus.subscribe('payment.received', async (payload: PaymentReceivedEvent) => {
    console.log(`[M08] Payment received for Invoice ${payload.invoiceId}: ${payload.amount}`);
    await salesService.handlePaymentReceived(payload);
  });
}
