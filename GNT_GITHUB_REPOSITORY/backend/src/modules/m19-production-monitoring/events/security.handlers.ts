import { AuditService } from '../services/audit.service';
import { SecurityInternal } from '../services/security.internal';
import { EventBusMessage, SecurityEventType } from './security.events';

export class SecurityEventHandlers {
  constructor(
    private readonly auditService: AuditService,
    private readonly securityInternal: SecurityInternal,
  ) {}

  async handleEvent(message: EventBusMessage): Promise<void> {
    const { eventType, companyId, userId, payload, ipAddress, userAgent } = message;

    await this.auditService.logAction({
      companyId, userId, action: eventType,
      module: this.extractModule(eventType),
      resource: (payload.resource as string) || 'unknown',
      resourceId: (payload.resourceId as string) || undefined,
      beforeData: (payload.before as Record<string, unknown>) || undefined,
      afterData: (payload.after as Record<string, unknown>) || undefined,
      ipAddress, userAgent,
    });

    switch (eventType) {
      case 'user.login.success':
        await this.auditService.recordLoginSuccess(companyId, userId || 'unknown', ipAddress || 'unknown', payload);
        await this.securityInternal.detectAnomaly({ companyId, eventType: 'user.login.success', userId, ipAddress, metadata: payload });
        break;
      case 'user.login.failed':
        await this.auditService.recordLoginFailed(companyId, userId || 'unknown', ipAddress || 'unknown', payload);
        await this.securityInternal.detectAnomaly({ companyId, eventType: 'user.login.failed', userId, ipAddress, metadata: payload });
        break;
      case 'permission.changed':
        await this.securityInternal.detectAnomaly({ companyId, eventType: 'permission.changed', userId, metadata: payload });
        break;
      case 'integration.webhook.failed':
        await this.securityInternal.detectAnomaly({ companyId, eventType: 'integration.webhook.failed', metadata: payload });
        break;
    }
  }

  private extractModule(eventType: SecurityEventType): string {
    const map: Record<string, string> = {
      'user.login.success': 'M02', 'user.login.failed': 'M02',
      'sales.invoice.created': 'M08', 'purchase.invoice.approved': 'M07',
      'stock.updated': 'M06', 'payment.received': 'M11',
      'permission.changed': 'M04', 'gst.return.filed': 'M09',
      'employee.salary.processed': 'M12', 'integration.webhook.failed': 'M18',
    };
    return map[eventType] || 'UNKNOWN';
  }
}

// ============================================================================
// 2026-09-06 (Claude — cross-module wiring pass): pehle SecurityEventHandlers ko
// kabhi bus se subscribe nahi kiya jaata tha — yaani business events kabhi audit
// trail me nahi jaate the (sirf HTTP-route wale actions). Ab
// `registerSecurityEventHandlers()` M19 mount par (module-registry) canonical
// `GNT_EVENTS.*` sunta hai aur har ek ko append-only `audit_log` me likhta hai.
// Upar wali class ka `EventBusMessage` envelope business events me nahi hota —
// isliye yahan chhota adapter: (eventName, payload) → eventCompanyId →
// AuditService.logAction(). Ek handler ka girna doosre events ko nahi rokta.
// ============================================================================
import { eventBus } from '@/common/events/event-bus';
import { GNT_EVENTS, eventCompanyId } from '@/common/events/event-catalog';
import { prisma } from '@/common/config/prisma';
import { AuditRepository } from '../repositories/audit.repository';

let auditWiringRegistered = false;

const EVENT_MODULE: Record<string, string> = {
  [GNT_EVENTS.SALES_INVOICE_CREATED]: 'M08',
  [GNT_EVENTS.SALES_RETURN_CREATED]: 'M08',
  [GNT_EVENTS.PURCHASE_INVOICE_APPROVED]: 'M07',
  [GNT_EVENTS.STOCK_UPDATED]: 'M06',
  [GNT_EVENTS.STOCK_LOW]: 'M06',
  [GNT_EVENTS.GST_EINVOICE_GENERATED]: 'M09',
  [GNT_EVENTS.PAYMENT_COMPLETED]: 'M11',
  [GNT_EVENTS.PAYMENT_FAILED]: 'M11',
  [GNT_EVENTS.PAYROLL_GENERATED]: 'M12',
  [GNT_EVENTS.PAYROLL_PAID]: 'M12',
  [GNT_EVENTS.IMPORT_COMPLETED]: 'M14',
  [GNT_EVENTS.EXPORT_COMPLETED]: 'M14',
  [GNT_EVENTS.PERMISSION_CHANGED]: 'M04',
  [GNT_EVENTS.INTEGRATION_WEBHOOK_FAILED]: 'M18',
};

export function registerSecurityEventHandlers(): void {
  if (auditWiringRegistered) return;
  auditWiringRegistered = true;

  const auditService = new AuditService(new AuditRepository(prisma));

  const record = async (eventName: string, payload: unknown): Promise<void> => {
    const companyId = eventCompanyId(payload);
    if (!companyId) return; // company id ke bina audit row tenant-safe nahi
    const p = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>;
    await auditService.logAction({
      companyId,
      userId: typeof p.userId === 'string' ? p.userId : undefined,
      action: eventName,
      module: EVENT_MODULE[eventName] ?? 'UNKNOWN',
      resource: 'event',
      resourceId:
        (typeof p.transactionId === 'string' && p.transactionId) ||
        (typeof p.invoiceId === 'string' && p.invoiceId) ||
        (typeof p.payrollId === 'string' && p.payrollId) ||
        (typeof p.jobId === 'string' && p.jobId) ||
        undefined,
      afterData: p,
    });
  };

  for (const name of Object.keys(EVENT_MODULE)) {
    eventBus.subscribe(name, (payload: unknown) => {
      record(name, payload).catch((e) => console.error(`[M19] audit for "${name}" failed:`, e));
    });
  }

  console.log('[M19] security/audit event handlers registered');
}
