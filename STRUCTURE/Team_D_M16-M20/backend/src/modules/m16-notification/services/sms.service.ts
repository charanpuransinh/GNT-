/**
 * GNT M16 — SMS Gateway Connector
 * Integrates with M18 gateway.service.ts for external routing
 */

import { SendNotificationPayload } from '../types/notification.types';
import { notificationRepository } from '../repositories/notification.repository';

// Mock M18 integration
const gatewayService = {
  sendViaGateway: async (channel: string, payload: any) => {
    console.log(`[M18 Gateway] Sending via ${channel}:`, payload);
    return { success: true, messageId: `sms-${Date.now()}` };
  },
};

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
      const response = await gatewayService.sendViaGateway('sms', smsPayload);

      if (response.success) {
        await notificationRepository.updateStatus(notificationId, 'sent');
        await notificationRepository.createDeliveryLog(
          notificationId,
          'sms',
          'delivered',
          JSON.stringify(response)
        );
      } else {
        throw new Error('SMS gateway returned failure');
      }
    } catch (error) {
      await notificationRepository.createDeliveryLog(
        notificationId,
        'sms',
        'failed',
        undefined,
        error instanceof Error ? error.message : 'SMS delivery failed'
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
