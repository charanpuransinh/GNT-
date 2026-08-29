/**
 * GNT M16 — Notification Internal Service
 * Channel routing logic — INTERNAL to M16 only
 */

import { SendNotificationPayload } from '../types/notification.types';
import { notificationRepository } from '../repositories/notification.repository';
import { whatsappService } from './whatsapp.service';
import { smsService } from './sms.service';
import { emailService } from './email.service';

class NotificationInternal {
  /**
   * Route notification to appropriate channel handler
   */
  async routeToChannel(
    notificationId: string,
    channel: string,
    payload: SendNotificationPayload
  ): Promise<void> {
    // Log attempt
    await notificationRepository.createDeliveryLog(notificationId, channel, 'attempted');

    try {
      switch (channel) {
        case 'in_app':
          await this.handleInApp(notificationId);
          break;
        case 'whatsapp':
          await whatsappService.send(notificationId, payload);
          break;
        case 'sms':
          await smsService.send(notificationId, payload);
          break;
        case 'email':
          await emailService.send(notificationId, payload);
          break;
        default:
          throw new Error(`Unsupported channel: ${channel}`);
      }
    } catch (error) {
      await notificationRepository.createDeliveryLog(
        notificationId,
        channel,
        'failed',
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }

  /**
   * In-app notifications are stored only (no external delivery)
   */
  private async handleInApp(notificationId: string): Promise<void> {
    await notificationRepository.updateStatus(notificationId, 'sent');
    await notificationRepository.createDeliveryLog(notificationId, 'in_app', 'delivered');
  }
}

export const notificationInternal = new NotificationInternal();
