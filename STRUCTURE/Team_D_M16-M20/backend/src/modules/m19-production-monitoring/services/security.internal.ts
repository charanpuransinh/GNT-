import { SecurityRepository } from '../repositories/security.repository';
import { AuditRepository } from '../repositories/audit.repository';
import { AnomalyCheckInput, SecurityEventEntry, SecurityEventFilters } from '../types/security.types';

export class SecurityInternal {
  constructor(
    private readonly securityRepo: SecurityRepository,
    private readonly auditRepo: AuditRepository,
  ) {}

  async detectAnomaly(input: AnomalyCheckInput): Promise<{ anomalyDetected: boolean; events: SecurityEventEntry[] }> {
    const events: SecurityEventEntry[] = [];
    const { companyId, eventType, metadata, ipAddress, userId } = input;

    // Rule 1: Brute force detection
    if (eventType === 'user.login.failed' && userId) {
      const failedCount = await this.securityRepo.getRecentFailedAttempts(companyId, userId, 30);
      if (failedCount >= 5) {
        const event = await this.securityRepo.createSecurityEvent({
          companyId,
          eventType: 'brute_force_detected',
          severity: 'high',
          description: `Multiple failed login attempts (${failedCount}) for user ${userId}`,
          metadata: { userId, ipAddress, failedCount, ...metadata },
        });
        events.push(event);
      }
    }

    // Rule 2: Suspicious IP activity
    if (ipAddress) {
      const ipEvents = await this.securityRepo.getEventsByIp(companyId, ipAddress, 60);
      if (ipEvents >= 20) {
        const event = await this.securityRepo.createSecurityEvent({
          companyId,
          eventType: 'suspicious_ip_activity',
          severity: 'critical',
          description: `High volume of security events from IP ${ipAddress}`,
          metadata: { ipAddress, eventCount: ipEvents, ...metadata },
        });
        events.push(event);
      }
    }

    // Rule 3: Permission change alert
    if (eventType === 'permission.changed') {
      const event = await this.securityRepo.createSecurityEvent({
        companyId,
        eventType: 'permission_change_alert',
        severity: 'medium',
        description: `Permission changed for user ${userId || 'unknown'}`,
        metadata: { userId, ...metadata },
      });
      events.push(event);
    }

    // Rule 4: Webhook failure
    if (eventType === 'integration.webhook.failed') {
      const event = await this.securityRepo.createSecurityEvent({
        companyId,
        eventType: 'integration_failure',
        severity: 'medium',
        description: 'Webhook integration failed',
        metadata: { ...metadata },
      });
      events.push(event);
    }

    // Rule 5: After hours access (10 PM - 6 AM)
    const hour = new Date().getHours();
    if ((hour >= 22 || hour < 6) && eventType === 'user.login.success' && userId) {
      const event = await this.securityRepo.createSecurityEvent({
        companyId,
        eventType: 'after_hours_access',
        severity: 'low',
        description: `After-hours login detected for user ${userId}`,
        metadata: { userId, ipAddress, hour, ...metadata },
      });
      events.push(event);
    }

    return { anomalyDetected: events.length > 0, events };
  }

  async getSecurityEvents(filters: SecurityEventFilters): Promise<SecurityEventEntry[]> {
    return this.securityRepo.getSecurityEvents(filters);
  }

  async resolveSecurityEvent(eventId: string): Promise<void> {
    return this.securityRepo.resolveEvent(eventId);
  }
}
