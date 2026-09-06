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

  // Incoming events (M16 subscribes) — naam wahi jo publisher SACH ME emit karta hai
  // (M08 sales.service `sales.invoice.created` publish karta hai, `invoice.created` nahi;
  //  M07 abhi publish nahi karta par canonical naam `purchase.invoice.approved` hai)
  SALES_INVOICE_CREATED: 'sales.invoice.created',
  PURCHASE_INVOICE_APPROVED: 'purchase.invoice.approved',
  PAYMENT_RECEIVED: 'payment.completed',
  STOCK_LOW: 'stock.low',
  GST_RETURN_DUE: 'gst.return.due',
  EMPLOYEE_SALARY_PROCESSED: 'payroll.paid',
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
