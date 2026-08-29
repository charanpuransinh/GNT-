// ============================================================================
// M07 PURCHASE MANAGEMENT — Event Definitions
// ============================================================================

export const PURCHASE_EVENTS = {
  INVOICE_APPROVED: 'purchase.invoice.approved',
  INVOICE_POSTED: 'purchase.invoice.posted',
  INVOICE_CANCELLED: 'purchase.invoice.cancelled',
  ORDER_CREATED: 'purchase.order.created',
  ORDER_SENT: 'purchase.order.sent',
  ORDER_RECEIVED: 'purchase.order.received',
  RETURN_APPROVED: 'purchase.return.approved',
  RETURN_POSTED: 'purchase.return.posted',
} as const;

export type PurchaseEventType = typeof PURCHASE_EVENTS[keyof typeof PURCHASE_EVENTS];

export interface EventPayload<T = unknown> {
  event: PurchaseEventType;
  payload: T;
  timestamp: Date;
  source: 'm07-purchase';
  trace_id: string;
}
