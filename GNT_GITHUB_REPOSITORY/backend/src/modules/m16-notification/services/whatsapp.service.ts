/**
 * GNT M16 — WhatsApp Business API Connector
 * Integrates with M18 gateway.service.ts for external routing
 */

import { SendNotificationPayload } from '../types/notification.types';
import { notificationRepository } from '../repositories/notification.repository';
import { notificationGateway } from './gateway.binding';


class WhatsAppService {
  /**
   * Send notification via WhatsApp Business API (M18 GatewayService)
   */
  async send(notificationId: string, payload: SendNotificationPayload): Promise<void> {
    try {
      if (!payload.toAddress) {
        throw new Error('Recipient address (toAddress) missing — fail-closed (userId को phone नहीं माना गया)');
      }
      await notificationGateway.sendWhatsApp(payload.companyId, {
        phone: payload.toAddress,
        message: this.formatTemplate(payload.title, payload.message),
        template_name: 'notification_alert',
      });
      await notificationRepository.createDeliveryLog(notificationId, 'whatsapp', 'delivered');
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
