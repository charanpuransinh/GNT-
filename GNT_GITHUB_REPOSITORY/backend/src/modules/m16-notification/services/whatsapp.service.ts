/**
 * GNT M16 — WhatsApp Business API Connector
 * Integrates with M18 gateway.service.ts for external routing
 */

import { SendNotificationPayload } from '../types/notification.types';
import { notificationRepository } from '../repositories/notification.repository';


class WhatsAppService {
  /**
   * Send notification via WhatsApp Business API
   */
  async send(notificationId: string, payload: SendNotificationPayload): Promise<void> {
    const message = {
      to: payload.userId, // Would resolve to phone via M05 party.service.ts
      templateName: 'notification_alert',
      parameters: {
        title: payload.title,
        message: payload.message,
        entityType: payload.entityType,
        entityId: payload.entityId,
      },
    };
    try {
      // M18 is the sole external-gateway owner. This adapter intentionally fails closed
      // until M18 is bound through the canonical application composition root.
      throw new Error('M18 gateway adapter is not bound for whatsapp; configure an active M18 provider before enabling delivery');
    } catch (error) {
      await notificationRepository.createDeliveryLog(
        notificationId,
        'whatsapp',
        'failed',
        undefined,
        error instanceof Error ? error.message : 'whatsapp delivery failed'
      );
      throw error;
    }
  }

  /**
   * Validate WhatsApp number format
   */
  validateNumber(phone: string): boolean {
    const regex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/;
    return regex.test(phone);
  }

  /**
   * Format message for WhatsApp template
   */
  formatTemplate(title: string, message: string): string {
    return `*${title}*\n\n${message}`;
  }
}

export const whatsappService = new WhatsAppService();
