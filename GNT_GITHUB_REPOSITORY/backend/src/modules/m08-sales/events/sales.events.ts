/**
 * M08 SALES & BILLING — Event Definitions
 * Module: m08-sales | Team: B4-BRAVO
 */

export const SALES_EVENTS = {
  INVOICE_CREATED: 'sales.invoice.created',
  QUOTATION_CONVERTED: 'sales.quotation.converted',
  RETURN_CREATED: 'sales.return.created',
} as const;

export type SalesEventType = typeof SALES_EVENTS[keyof typeof SALES_EVENTS];
