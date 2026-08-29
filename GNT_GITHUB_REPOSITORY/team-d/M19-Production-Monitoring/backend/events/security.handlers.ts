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
