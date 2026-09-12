/**
 * M23 — privacy/sensitive-data.guard.ts
 * OWN: Block unauthorized access to fields marked sensitive.
 *
 * Rule 16 (Global Rules): Do not log passwords, tokens, payment secrets,
 * full financial credentials or unnecessary personal information.
 */

import { AuthContext } from '../access/authorization.service';
import { authorizationService } from '../access/authorization.service';
import { securityEventService } from '../audit/security-event.service';

export interface SensitiveFieldDefinition {
  field: string;
  requiredPermission: string;
}

export class SensitiveDataGuard {
  /**
   * Given a record and a list of sensitive-field definitions, returns the
   * subset of field names the caller is NOT authorized to see. Callers use
   * this before data-masking.service.ts masks those fields.
   */
  async findUnauthorizedFields(
    auth: AuthContext,
    resourceTenantId: string,
    sensitiveFields: SensitiveFieldDefinition[],
  ): Promise<string[]> {
    const denied: string[] = [];

    for (const def of sensitiveFields) {
      const result = authorizationService.evaluate({
        auth,
        requiredPermission: def.requiredPermission,
        resourceTenantId,
      });
      if (!result.allowed) {
        denied.push(def.field);
      }
    }

    if (denied.length > 0) {
      await securityEventService.publish({
        eventName: 'SECURITY.SENSITIVE_DATA_ACCESSED',
        tenantId: auth.tenantId,
        actorId: auth.userId,
        correlationId: auth.correlationId,
        entityType: 'sensitive_field_set',
        entityId: denied.join(','),
        payload: { deniedFields: denied },
      });
    }

    return denied;
  }
}

export const sensitiveDataGuard = new SensitiveDataGuard();
