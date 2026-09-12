/**
 * M25 — websocket/websocket-router.ts
 * OWN: Route approved events to clients.
 */

import { WebSocketServer, webSocketServer } from './websocket.server';
import { GntEvent } from '../events/event-emitter';

/** Only events on this allow-list are pushed to clients over the socket. */
const CLIENT_DELIVERABLE_EVENTS = new Set([
  'NOTIFICATION.CREATED',
  'NOTIFICATION.SENT',
  'EVENT.PUBLISHED',
]);

export class WebSocketRouter {
  constructor(private readonly server: WebSocketServer) {}

  /**
   * Push an internal event to connected clients of the event's tenant,
   * but only if it's on the client-deliverable allow-list — internal
   * events (e.g. security audit events) are never forwarded to the browser.
   */
  routeToClients(event: GntEvent): number {
    if (!CLIENT_DELIVERABLE_EVENTS.has(event.eventName)) {
      return 0;
    }
    const payload = JSON.stringify({
      eventName: event.eventName,
      entityType: event.entityType,
      entityId: event.entityId,
      payload: event.payload,
      correlationId: event.correlationId,
    });
    return this.server.broadcastToTenant(event.tenantId, payload);
  }
}

export const webSocketRouter = new WebSocketRouter(webSocketServer);
