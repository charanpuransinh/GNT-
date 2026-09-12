/**
 * M25 — Real-Time & Events — Public exports.
 *
 * Notification pieces from the original blueprint (NotificationsService,
 * NotificationRouter, NotificationPreferencesService, ChannelSender email/
 * SMS/push senders) are intentionally NOT exported here — M16-notification
 * already owns that domain for real (email/SMS/WhatsApp senders,
 * notification_master table, its own events). See M25_INTEGRATION_NOTES.md.
 */

export { EventEmitter, eventEmitter, InMemoryEventTransport, type GntEvent, type EmitInput, type EventTransport } from './events/event-emitter';
export { EventRouter, eventRouter, type EventHandler } from './events/event-router';
export { EventRegistry, eventRegistry, EventRegistryError, type RegisteredEventDefinition } from './events/event-registry';

export {
  WebSocketServer,
  webSocketServer,
  type SocketConnection,
} from './websocket/websocket.server';
export {
  WebSocketAuthGuard,
  webSocketAuthGuard,
  WebSocketAuthError,
  type VerifiedSocketIdentity,
  type TokenVerifier,
} from './websocket/websocket-auth.guard';
export { WebSocketRouter, webSocketRouter } from './websocket/websocket-router';
