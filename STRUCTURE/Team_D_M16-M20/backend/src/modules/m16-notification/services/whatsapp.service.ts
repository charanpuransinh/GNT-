/**
 * GNT M16 — WhatsApp Business API Connector
 * Integrates with M18 gateway.service.ts for external routing
 */

import { SendNotificationPayload } from '../types/notification.types';
import { notificationRepository } from '../repositories/notification.repository';

// Mock M18 integration — replace with actual import
const gatewayService = {
  sendViaGateway: async (channel: string, payload: any) => {
    // Integration with M18 integration.service.ts
    console.log(`[M18 Gateway] Sending via ${channel}:`, payload);
    return { success: true, messageId: `wa-${Date.now()}` };
  },
};

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
      const response = await gatewayService.sendViaGateway('whatsapp', message);

      if (response.success) {
        await notificationRepository.updateStatus(notificationId, 'sent');
        await notificationRepository.createDeliveryLog(
          notificationId,
          'whatsapp',
          'delivered',
          JSON.stringify(response)
        );
      } else {
        throw new Error('WhatsApp gateway returned failure');
      }
    } catch (error) {
      await notificationRepository.createDeliveryLog(
        notificationId,
        'whatsapp',
        'failed',
        undefined,
        error instanceof Error ? error.message : 'WhatsApp delivery failed'
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
