/**
 * GNT M16 — Notification Event Definitions
 * Event bus contracts for cross-module communication
 */

export const NotificationEvents = {
  // Outgoing events (M16 emits)
  SENT: 'notification.sent',
  DELIVERED: 'notification.delivered',
  FAILED: 'notification.failed',
  READ: 'notification.read',

  // Incoming events (M16 subscribes)
  SALES_INVOICE_CREATED: 'sales.invoice.created',
  PURCHASE_INVOICE_APPROVED: 'purchase.invoice.approved',
  PAYMENT_RECEIVED: 'payment.received',
  STOCK_LOW: 'stock.low',
  GST_RETURN_DUE: 'gst.return.due',
  EMPLOYEE_SALARY_PROCESSED: 'employee.salary.processed',
} as const;

export type NotificationEventType = typeof NotificationEvents[keyof typeof NotificationEvents];

export interface NotificationSentEvent {
  notificationId: string;
  userId: string;
  companyId: string;
  channels: string[];
  timestamp: string;
}

export interface NotificationDeliveredEvent {
  notificationId: string;
  channel: string;
  providerResponse?: string;
  timestamp: string;
}

export interface NotificationFailedEvent {
  notificationId: string;
  channel: string;
  error: string;
  timestamp: string;
}

export interface NotificationReadEvent {
  notificationId: string;
  userId: string;
  readAt: string;
}
