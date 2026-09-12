/**
 * M25 — events/event-registry.ts
 * OWN: Maintain approved event definitions.
 * Event Contract (Section 22): every event must carry eventId, eventName,
 * occurredAt, tenantId, actorId, correlationId, entityType, entityId,
 * payloadVersion, payload.
 */

export interface RegisteredEventDefinition {
  eventName: string;
  ownerModule: string;
  description: string;
  payloadVersion: number;
}

export class EventRegistryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EventRegistryError';
  }
}

export class EventRegistry {
  private definitions = new Map<string, RegisteredEventDefinition>();

  register(definition: RegisteredEventDefinition): void {
    if (this.definitions.has(definition.eventName)) {
      throw new EventRegistryError(`Event "${definition.eventName}" is already registered`);
    }
    this.definitions.set(definition.eventName, definition);
  }

  isRegistered(eventName: string): boolean {
    return this.definitions.has(eventName);
  }

  get(eventName: string): RegisteredEventDefinition | undefined {
    return this.definitions.get(eventName);
  }

  list(): RegisteredEventDefinition[] {
    return [...this.definitions.values()];
  }
}

export const eventRegistry = new EventRegistry();

// WIRED (2026-09-12): NOTIFICATION.CREATED/SENT/FAILED removed from this list.
// M16-notification already owns notification creation/delivery/events end to
// end (real email/SMS/WhatsApp senders, notification_master table, its own
// NotificationEvents) — wiring a second, parallel notification system here
// would duplicate that domain. See M25_INTEGRATION_NOTES.md.
[
  'EVENT.PUBLISHED',
  'SOCKET.CONNECTED',
  'SOCKET.DISCONNECTED',
].forEach((eventName) =>
  eventRegistry.register({ eventName, ownerModule: 'M25', description: 'M25-owned event', payloadVersion: 1 }),
);
