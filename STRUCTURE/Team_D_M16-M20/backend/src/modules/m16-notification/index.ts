/**
 * GNT M16 — Notification Engine (Backend Public Exports)
 * 
 * RULE: External modules may ONLY import from this index.
 *       Direct imports from internal files are ILLEGAL.
 */

// PUBLIC API — Safe for external consumption
export { notificationService } from './services/notification.service';
export type {
  SendNotificationPayload,
  NotificationFilter,
  NotificationListResponse,
  DeliveryTrackingResponse,
  UnreadCountResponse,
  MarkReadPayload,
  EventNotificationPayload,
  NotificationMaster,
  NotificationDeliveryLog,
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
  NotificationEntityType,
} from './types/notification.types';

// Event contracts
export { NotificationEvents } from './events/notification.events';
export type {
  NotificationSentEvent,
  NotificationDeliveredEvent,
  NotificationFailedEvent,
  NotificationReadEvent,
} from './events/notification.events';

// Route registration
export { default as notificationRoutes } from './routes/notification.routes';

// Event handler initialization
export { notificationEventHandlers } from './events/notification.handlers';

// Validation schemas (for shared use)
export {
  sendNotificationSchema,
  notificationFilterSchema,
  markReadSchema,
  eventNotificationSchema,
} from './validators/notification.schema';
