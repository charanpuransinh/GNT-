/**
 * M25 — adapters/real-event-transport.ts
 * WIRED (2026-09-12): EventTransport over the real shared `eventBus`.
 *
 * Unlike M23's SECURITY.* events, these three M25 event names
 * (EVENT.PUBLISHED, SOCKET.CONNECTED, SOCKET.DISCONNECTED) are intra-module
 * lifecycle plumbing, not cross-module business events — they are
 * deliberately NOT added to event-catalog.ts's GNT_EVENTS (that catalog's
 * own header scopes it to cross-module business events like
 * sales.invoice.created). Published directly under their M25 registry name.
 */

import { eventBus } from '@/common/events/event-bus';
import type { EventTransport, GntEvent } from '../events/event-emitter';

export class RealEventTransport implements EventTransport {
  async publish(event: GntEvent): Promise<void> {
    await eventBus.publish(event.eventName, { ...event, companyId: event.tenantId });
  }
}

export const realEventTransport = new RealEventTransport();
