/**
 * GNT M16 — SMS Gateway Connector
 * Integrates with M18 gateway.service.ts for external routing
 */

import { SendNotificationPayload } from '../types/notification.types';
import { notificationRepository } from '../repositories/notification.repository';


class SMSService {
  /**
   * Send notification via SMS Gateway
   */
  async send(notificationId: string, payload: SendNotificationPayload): Promise<void> {
    const smsPayload = {
      to: payload.userId, // Would resolve to phone via M05
      message: this.truncateMessage(`${payload.title}: ${payload.message}`, 160),
      senderId: 'GNTALERT',
    };
    try {
      // M18 is the sole external-gateway owner. This adapter intentionally fails closed
      // until M18 is bound through the canonical application composition root.
      throw new Error('M18 gateway adapter is not bound for sms; configure an active M18 provider before enabling delivery');
    } catch (error) {
      await notificationRepository.createDeliveryLog(
        notificationId,
        'sms',
        'failed',
        undefined,
        error instanceof Error ? error.message : 'sms delivery failed'
      );
      throw error;
    }
  }

  /**
   * Truncate message to SMS character limit
   */
  truncateMessage(message: string, limit: number = 160): string {
    if (message.length <= limit) return message;
    return message.substring(0, limit - 3) + '...';
  }

  /**
   * Validate phone number for SMS
   */
  validatePhone(phone: string): boolean {
    const regex = /^[+]?[0-9]{10,15}$/;
    return regex.test(phone);
  }
}

export const smsService = new SMSService();
