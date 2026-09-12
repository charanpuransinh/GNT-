/**
 * M25 — events/event-router.ts
 * OWN: Route events to registered handlers.
 */

import { GntEvent } from './event-emitter';
import { EventRegistry, eventRegistry, EventRegistryError } from './event-registry';

export type EventHandler = (event: GntEvent) => Promise<void>;

export class EventRouter {
  private handlers = new Map<string, EventHandler[]>();

  constructor(private readonly registry: EventRegistry = eventRegistry) {}

  subscribe(eventName: string, handler: EventHandler): void {
    if (!this.registry.isRegistered(eventName)) {
      throw new EventRegistryError(`Cannot subscribe to unregistered event "${eventName}"`);
    }
    const existing = this.handlers.get(eventName) ?? [];
    existing.push(handler);
    this.handlers.set(eventName, existing);
  }

  /**
   * Routes to all subscribed handlers. A single handler failure is isolated
   * (Rule 12 — Failure Safety: external/handler failure must not corrupt
   * transaction state) and reported, not thrown, so one bad subscriber
   * cannot break delivery to the others.
   */
  async route(event: GntEvent): Promise<{ delivered: number; failed: number }> {
    const handlers = this.handlers.get(event.eventName) ?? [];
    let delivered = 0;
    let failed = 0;

    await Promise.all(
      handlers.map(async (handler) => {
        try {
          await handler(event);
          delivered += 1;
        } catch {
          failed += 1;
        }
      }),
    );

    return { delivered, failed };
  }
}

export const eventRouter = new EventRouter();
