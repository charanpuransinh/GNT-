/**
 * M25 — events/event-emitter.ts
 * OWN: Publish application events, following the Event Contract (Section 22).
 *
 * WIRED (2026-09-12): default transport is `realEventTransport`
 * (adapters/real-event-transport.ts), over the real shared `eventBus`.
 */

import { realEventTransport } from '../adapters/real-event-transport';

export interface GntEvent {
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
}

export interface EventTransport {
  publish(event: GntEvent): Promise<void>;
}

/** No-op transport — used only by unit tests that don't want a real eventBus. */
export class InMemoryEventTransport implements EventTransport {
  async publish(): Promise<void> {
    // no-op
  }
}

export interface EmitInput {
  eventName: string;
  tenantId: string;
  actorId: string;
  correlationId: string;
  entityType: string;
  entityId: string;
  payload?: Record<string, unknown>;
}

export class EventEmitter {
  constructor(private readonly transport: EventTransport = realEventTransport) {}

  async emit(input: EmitInput): Promise<GntEvent> {
    const event: GntEvent = {
      eventId: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      eventName: input.eventName,
      occurredAt: new Date().toISOString(),
      tenantId: input.tenantId,
      actorId: input.actorId,
      correlationId: input.correlationId,
      entityType: input.entityType,
      entityId: input.entityId,
      payloadVersion: 1,
      payload: input.payload ?? {},
    };
    await this.transport.publish(event);
    return event;
  }
}

export const eventEmitter = new EventEmitter();
