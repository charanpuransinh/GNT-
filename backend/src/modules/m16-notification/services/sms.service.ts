/**
 * SMS Service with safe error typing
 */
import { SendNotificationPayload } from '../types/notification.types';
import { notificationRepository } from '../repositories/notification.repository';

class SMSService {
  async send(notificationId: string, payload: SendNotificationPayload): Promise<void> {
    const smsPayload = {
      to: payload.userId,
      message: this.truncateMessage(`${payload.title}: ${payload.message}`, 160),
      senderId: 'GNTALERT',
    };

    try {
      throw new Error('M18 gateway adapter is not bound for sms; configure an active M18 provider before enabling delivery');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'sms delivery failed';
      await notificationRepository.createDeliveryLog(notificationId, 'sms', 'failed', undefined, message);
      throw error;
    }
  }

  truncateMessage(message: string, limit: number = 160): string {
    if (message.length <= limit) return message;
    return message.substring(0, limit - 3) + '...';
  }

  validatePhone(phone: string): boolean {
    const regex = /^[+]?[0-9]{10,15}$/;
    return regex.test(phone);
  }
}

export const smsService = new SMSService();
