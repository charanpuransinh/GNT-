/**
 * M23 — audit/security-event.service.ts
 * OWN: Publish M23 security events, following the Event Contract (Section 22).
 *
 * Events owned by M23:
 *   SECURITY.ACCESS_DENIED
 *   SECURITY.CROSS_TENANT_ATTEMPT
 *   SECURITY.POLICY_CHANGED
 *   SECURITY.SENSITIVE_DATA_ACCESSED
 *   SECURITY.RETENTION_EXECUTED
 *
 * WIRED (2026-09-12): verified shared EventBus at
 * backend/src/common/events/event-bus.ts. Default publisher is
 * `realEventPublisher` (adapters/real-event-publisher.ts), which maps
 * these five M23 event names onto GNT_EVENTS.SECURITY_* (event-catalog.ts)
 * and calls the real eventBus.publish().
 */

import { realEventPublisher } from '../adapters/real-event-publisher';

export type M23EventName =
  | 'SECURITY.ACCESS_DENIED'
  | 'SECURITY.CROSS_TENANT_ATTEMPT'
  | 'SECURITY.POLICY_CHANGED'
  | 'SECURITY.SENSITIVE_DATA_ACCESSED'
  | 'SECURITY.RETENTION_EXECUTED';

export interface M23Event {
  eventName: M23EventName;
  tenantId: string;
  actorId: string;
  correlationId: string;
  entityType: string;
  entityId: string;
  payload?: Record<string, unknown>;
}

export interface EventPublisher {
  publish(event: {
    eventId: string;
    eventName: string;
    occurredAt: string;
    tenantId: string;
    actorId: string;
    correlationId: string;
    entityType: string;
    entityId: string;
    payloadVersion: number;
    payload: Record<string, unknown>;
  }): Promise<void>;
}

/** No-op publisher — used only by unit tests that don't want a real eventBus. */
export class InMemoryEventPublisher implements EventPublisher {
  async publish(): Promise<void> {
    // no-op
  }
}

export class SecurityEventService {
  constructor(private readonly publisher: EventPublisher) {}

  async publish(event: M23Event): Promise<void> {
    await this.publisher.publish({
      eventId: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      eventName: event.eventName,
      occurredAt: new Date().toISOString(),
      tenantId: event.tenantId,
      actorId: event.actorId,
      correlationId: event.correlationId,
      entityType: event.entityType,
      entityId: event.entityId,
      payloadVersion: 1,
      payload: event.payload ?? {},
    });
  }
}

export const securityEventService = new SecurityEventService(realEventPublisher);
