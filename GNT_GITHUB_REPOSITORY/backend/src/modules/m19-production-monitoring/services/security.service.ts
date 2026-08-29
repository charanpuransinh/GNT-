/**
 * GNT M19 — Security Service (PUBLIC)
 *
 * This is the ONLY file external modules may import from M19's
 * security feature-set. security.internal.ts stays private — it holds
 * the anomaly-detection rules and must not be imported outside M19.
 *
 * LEGAL:   M18 (webhook failures), M02 (login events) → security.service.*
 * ILLEGAL: Any module → security.internal.ts or security.repository.ts directly
 */
import { SecurityInternal } from './security.internal';
import { AnomalyCheckInput, SecurityEventEntry, SecurityEventFilters } from '../types/security.types';

export class SecurityService {
  constructor(private readonly internal: SecurityInternal) {}

  /**
   * PUBLIC API: Run anomaly-detection rules against a raw security event.
   * Consumed by: M02 (login success/failure), M18 (webhook failures)
   */
  async reportEvent(input: AnomalyCheckInput): Promise<{ anomalyDetected: boolean; events: SecurityEventEntry[] }> {
    return this.internal.detectAnomaly(input);
  }

  /**
   * PUBLIC API: Query security events for the admin/security dashboard.
   */
  async getSecurityEvents(filters: SecurityEventFilters): Promise<SecurityEventEntry[]> {
    return this.internal.getSecurityEvents(filters);
  }

  /**
   * PUBLIC API: Mark a security event as resolved.
   */
  async resolveSecurityEvent(eventId: string): Promise<void> {
    return this.internal.resolveSecurityEvent(eventId);
  }
}
