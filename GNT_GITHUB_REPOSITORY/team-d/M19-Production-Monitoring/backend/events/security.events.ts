export type SecurityEventType = 
  | 'user.login.success'
  | 'user.login.failed'
  | 'sales.invoice.created'
  | 'purchase.invoice.approved'
  | 'stock.updated'
  | 'payment.received'
  | 'permission.changed'
  | 'gst.return.filed'
  | 'employee.salary.processed'
  | 'integration.webhook.failed'
  | 'any.crud.action';

export interface EventBusMessage<T = Record<string, unknown>> {
  eventType: SecurityEventType;
  companyId: string;
  userId?: string;
  timestamp: string;
  payload: T;
  ipAddress?: string;
  userAgent?: string;
}
