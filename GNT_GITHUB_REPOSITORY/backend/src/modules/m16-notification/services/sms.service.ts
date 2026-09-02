/**
 * GNT M16 — SMS Gateway Connector
 * Integrates with M18 gateway.service.ts for external routing
 */

import { SendNotificationPayload } from '../types/notification.types';
import { notificationRepository } from '../repositories/notification.repository';
import { notificationGateway } from './gateway.binding';


class SMSService {
  /**
   * Send notification via SMS Gateway (M18 GatewayService)
   */
  async send(notificationId: string, payload: SendNotificationPayload): Promise<void> {
    try {
      if (!payload.toAddress) {
        throw new Error('Recipient address (toAddress) missing — fail-closed (userId को phone नहीं माना गया)');
      }
      await notificationGateway.sendSMS(payload.companyId, {
        phone: payload.toAddress,
        message: this.truncateMessage(`${payload.title}: ${payload.message}`, 160),
        sender_id: 'GNTALERT',
      });
      await notificationRepository.createDeliveryLog(notificationId, 'sms', 'delivered');
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
