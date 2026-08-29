// M11 Payment Module - Event Bus
// Cross-module communication via async events ONLY
// No direct DB access across modules

export class EventBus {
  private listeners: Map<string, Array<(payload: any) => void>> = new Map();

  on(event: string, handler: (payload: any) => void): void {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event)!.push(handler);
  }

  publish(event: string, payload: any): void {
    console.log(`[EVENT] ${event}`, JSON.stringify(payload, null, 2));
    const handlers = this.listeners.get(event) || [];
    handlers.forEach(h => {
      try { h(payload); } catch (e) { console.error(`[EVENT ERROR] ${event}:`, e); }
    });
  }

  publishAsync(event: string, payload: any): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        this.publish(event, payload);
        resolve();
      }, 0);
    });
  }

  // M13 Automation, M15 Sync consume these events
  static readonly EVENTS = {
    PAYMENT_CREATED: 'payment.created',
    PAYMENT_COMPLETED: 'payment.completed',
    PAYMENT_FAILED: 'payment.failed',
    PAYMENT_CANCELLED: 'payment.cancelled',
    INVOICE_CREATED: 'invoice.created',
    INVOICE_SENT: 'invoice.sent',
    INVOICE_PAID: 'invoice.payment_received',
    REFUND_REQUESTED: 'refund.requested',
    REFUND_COMPLETED: 'refund.completed',
    REFUND_REJECTED: 'refund.rejected',
    BANK_ACCOUNT_CREATED: 'bank_account.created',
    RECONCILIATION_CREATED: 'reconciliation.created',
    PAYMENT_METHOD_CREATED: 'payment_method.created',
  } as const;
}
