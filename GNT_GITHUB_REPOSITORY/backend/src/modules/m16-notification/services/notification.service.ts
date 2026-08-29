/**
 * GNT M16 — Notification Service (PUBLIC)
 * 
 * This is the ONLY file external modules may import from M16.
 * 
 * LEGAL: M05/M08/M09/M11/M13 → notification.service.sendNotification()
 * ILLEGAL: Any direct repository or DB access
 */

import {
  SendNotificationPayload,
  NotificationFilter,
  NotificationListResponse,
  DeliveryTrackingResponse,
  UnreadCountResponse,
  MarkReadPayload,
  EventNotificationPayload,
} from '../types/notification.types';
import { notificationRepository } from '../repositories/notification.repository';
import { notificationInternal } from './notification.internal';
import { eventBus } from '../../../core/event-bus';

class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * PUBLIC API: Send a notification
   * Consumed by: M05, M08, M09, M11, M13
   */
  async sendNotification(payload: SendNotificationPayload): Promise<{ notificationId: string; status: string }> {
    // 1. Create notification record
    const notification = await notificationRepository.create(payload);

    // 2. Route to appropriate channel(s)
    const channels = payload.channels ?? [payload.type];

    for (const channel of channels) {
      try {
        await notificationInternal.routeToChannel(notification.id, channel, payload);
      } catch (error) {
        console.error(`[M16] Channel routing failed for ${channel}:`, error);
        await notificationRepository.createDeliveryLog(
          notification.id,
          channel,
          'failed',
          undefined,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }

    // 3. Emit event for audit trail (M19)
    eventBus.emit('notification.sent', {
      notificationId: notification.id,
      userId: payload.userId,
      companyId: payload.companyId,
      channels,
      timestamp: new Date().toISOString(),
    });

    return {
      notificationId: notification.id,
      status: 'queued',
    };
  }

  /**
   * PUBLIC API: Get user notifications with filters
   */
  async getNotifications(filter: NotificationFilter): Promise<NotificationListResponse> {
    return notificationRepository.findMany(filter);
  }

  /**
   * PUBLIC API: Get unread count for user bell badge
   */
  async getUnreadCount(userId: string, companyId: string): Promise<UnreadCountResponse> {
    const count = await notificationRepository.getUnreadCount(userId, companyId);
    return { userId, count };
  }

  /**
   * PUBLIC API: Mark notification(s) as read
   */
  async markAsRead(payload: MarkReadPayload, userId: string, companyId: string): Promise<{ markedCount: number }> {
    let markedCount = 0;

    if (payload.markAll) {
      markedCount = await notificationRepository.markAllAsRead(userId, companyId);
    } else if (payload.notificationIds && payload.notificationIds.length > 0) {
      markedCount = await notificationRepository.markManyAsRead(payload.notificationIds);
    }

    return { markedCount };
  }

  /**
   * PUBLIC API: Track delivery status
   * Consumed by: M19 (Audit)
   */
  async trackDelivery(notificationId: string): Promise<DeliveryTrackingResponse> {
    const notification = await notificationRepository.findById(notificationId);
    if (!notification) {
      throw new Error(`Notification ${notificationId} not found`);
    }

    const logs = await notificationRepository.getDeliveryLogs(notificationId);

    return {
      notificationId,
      logs,
      overallStatus: notification.status,
    };
  }

  /**
   * PUBLIC API: Handle event-driven notifications
   */
  async handleEventNotification(eventPayload: EventNotificationPayload): Promise<void> {
    const { eventName, payload, targetUserIds, targetRoles, companyId } = eventPayload;

    // Resolve target users (would integrate with M05 for user resolution)
    const userIds = targetUserIds ?? [];

    for (const userId of userIds) {
      await this.sendNotification({
        userId,
        companyId,
        title: this.generateEventTitle(eventName),
        message: this.generateEventMessage(eventName, payload),
        type: 'in_app',
        entityType: this.mapEventToEntityType(eventName),
        priority: this.mapEventToPriority(eventName),
      });
    }
  }

  /**
   * PUBLIC API: Process pending notifications (batch job)
   */
  async processPendingNotifications(): Promise<{ processed: number; failed: number }> {
    const pending = await notificationRepository.getPendingNotifications(100);
    let processed = 0;
    let failed = 0;

    for (const notification of pending) {
      try {
        await notificationInternal.routeToChannel(
          notification.id,
          notification.type,
          {
            userId: notification.userId,
            companyId: notification.companyId,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            entityType: notification.entityType,
            entityId: notification.entityId ?? undefined,
            priority: notification.priority,
          }
        );
        processed++;
      } catch (error) {
        failed++;
        console.error(`[M16] Failed to process notification ${notification.id}:`, error);
      }
    }

    return { processed, failed };
  }

  private generateEventTitle(eventName: string): string {
    const titles: Record<string, string> = {
      'sales.invoice.created': 'New Sales Invoice',
      'purchase.invoice.approved': 'Purchase Invoice Approved',
      'payment.received': 'Payment Received',
      'stock.low': 'Low Stock Alert',
      'gst.return.due': 'GST Return Due',
      'employee.salary.processed': 'Salary Processed',
    };
    return titles[eventName] ?? 'New Notification';
  }

  private generateEventMessage(eventName: string, payload: Record<string, unknown>): string {
    const messages: Record<string, string> = {
      'sales.invoice.created': `A new sales invoice has been created.`,
      'purchase.invoice.approved': `A purchase invoice has been approved.`,
      'payment.received': `Payment has been received.`,
      'stock.low': `Stock levels are running low.`,
      'gst.return.due': `GST return is due soon.`,
      'employee.salary.processed': `Your salary has been processed.`,
    };
    return messages[eventName] ?? 'You have a new notification.';
  }

  private mapEventToEntityType(eventName: string): any {
    const mapping: Record<string, string> = {
      'sales.invoice.created': 'sales_invoice',
      'purchase.invoice.approved': 'purchase_invoice',
      'payment.received': 'payment',
      'stock.low': 'stock',
      'gst.return.due': 'gst_return',
      'employee.salary.processed': 'employee_salary',
    };
    return mapping[eventName] ?? 'general';
  }

  private mapEventToPriority(eventName: string): any {
    const mapping: Record<string, string> = {
      'sales.invoice.created': 'normal',
      'purchase.invoice.approved': 'normal',
      'payment.received': 'high',
      'stock.low': 'urgent',
      'gst.return.due': 'high',
      'employee.salary.processed': 'normal',
    };
    return mapping[eventName] ?? 'normal';
  }
}

export const notificationService = NotificationService.getInstance();
