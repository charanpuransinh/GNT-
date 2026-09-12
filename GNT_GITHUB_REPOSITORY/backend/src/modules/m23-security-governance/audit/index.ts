/**
 * M23 — audit/index.ts
 * Public exports for the audit sub-module.
 */

export {
  SecurityAuditService,
  securityAuditService,
  type SecurityAuditRecord,
  type SecurityAuditStore,
} from './security-audit.service';

export {
  SecurityEventService,
  securityEventService,
  type M23Event,
  type M23EventName,
  type EventPublisher,
} from './security-event.service';
