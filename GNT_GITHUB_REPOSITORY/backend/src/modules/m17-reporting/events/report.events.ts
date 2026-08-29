/**
 * M17 Reporting — Event Definitions
 * Owner: D4-DELTA
 */

export const REPORT_EVENTS = {
  // Events that M17 subscribes to
  SUBSCRIPTIONS: {
    SALES_INVOICE_CREATED: 'sales.invoice.created',
    PURCHASE_INVOICE_APPROVED: 'purchase.invoice.approved',
    STOCK_UPDATED: 'stock.updated',
    PAYMENT_RECEIVED: 'payment.received',
    EMPLOYEE_SALARY_PROCESSED: 'employee.salary.processed',
  },

  // Events that M17 publishes
  PUBLICATIONS: {
    REPORT_GENERATED: 'report.generated',
    REPORT_EXPORTED: 'report.exported',
    REPORT_SCHEDULED: 'report.scheduled',
  },
} as const;

export type ReportSubscriptionEvent =
  | typeof REPORT_EVENTS.SUBSCRIPTIONS.SALES_INVOICE_CREATED
  | typeof REPORT_EVENTS.SUBSCRIPTIONS.PURCHASE_INVOICE_APPROVED
  | typeof REPORT_EVENTS.SUBSCRIPTIONS.STOCK_UPDATED
  | typeof REPORT_EVENTS.SUBSCRIPTIONS.PAYMENT_RECEIVED
  | typeof REPORT_EVENTS.SUBSCRIPTIONS.EMPLOYEE_SALARY_PROCESSED;

export type ReportPublicationEvent =
  | typeof REPORT_EVENTS.PUBLICATIONS.REPORT_GENERATED
  | typeof REPORT_EVENTS.PUBLICATIONS.REPORT_EXPORTED
  | typeof REPORT_EVENTS.PUBLICATIONS.REPORT_SCHEDULED;
