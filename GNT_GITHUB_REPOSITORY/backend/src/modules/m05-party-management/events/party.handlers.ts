// ============================================================================
// M05 PARTY MANAGEMENT — Event Handlers (अभी हल्के — बस event publish करते हैं)
// ============================================================================

import { eventBus } from '@/common/events/event-bus';
import { PARTY_EVENTS, PartyEventPayload } from './party.events';

export class PartyEventHandlers {
  async publishCreated(payload: PartyEventPayload): Promise<void> {
    await eventBus.publish(PARTY_EVENTS.CREATED, payload);
  }

  async publishUpdated(payload: PartyEventPayload): Promise<void> {
    await eventBus.publish(PARTY_EVENTS.UPDATED, payload);
  }

  async publishDeactivated(payload: PartyEventPayload): Promise<void> {
    await eventBus.publish(PARTY_EVENTS.DEACTIVATED, payload);
  }
}

export const partyEventHandlers = new PartyEventHandlers();
