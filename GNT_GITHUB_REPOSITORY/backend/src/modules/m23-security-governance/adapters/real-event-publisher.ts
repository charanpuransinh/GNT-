/**
 * M23 — adapters/real-event-publisher.ts
 * WIRED (2026-09-12): implements EventPublisher over the REAL shared
 * `eventBus` (backend/src/common/events/event-bus.ts), verified against
 * project memory + source. M23's five event names are translated to the
 * canonical GNT_EVENTS catalog entries added in event-catalog.ts, so
 * subscribers can rely on GNT_EVENTS.* rather than M23's internal enum.
 */

import { eventBus } from '@/common/events/event-bus';
import { GNT_EVENTS } from '@/common/events/event-catalog';
import type { EventPublisher } from '../audit/security-event.service';
import type { M23EventName } from '../audit/security-event.service';

const CATALOG_NAME: Record<M23EventName, string> = {
  'SECURITY.ACCESS_DENIED': GNT_EVENTS.SECURITY_ACCESS_DENIED,
  'SECURITY.CROSS_TENANT_ATTEMPT': GNT_EVENTS.SECURITY_CROSS_TENANT_ATTEMPT,
  'SECURITY.POLICY_CHANGED': GNT_EVENTS.SECURITY_POLICY_CHANGED,
  'SECURITY.SENSITIVE_DATA_ACCESSED': GNT_EVENTS.SECURITY_SENSITIVE_DATA_ACCESSED,
  'SECURITY.RETENTION_EXECUTED': GNT_EVENTS.SECURITY_RETENTION_EXECUTED,
};

export class RealEventPublisher implements EventPublisher {
  async publish(event: {
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
  }): Promise<void> {
    const catalogName = CATALOG_NAME[event.eventName as M23EventName] ?? event.eventName;
    await eventBus.publish(catalogName, {
      ...event,
      companyId: event.tenantId, // eventCompanyId() reads tenantId|companyId|company_id — both provided for safety
    });
  }
}

export const realEventPublisher = new RealEventPublisher();
