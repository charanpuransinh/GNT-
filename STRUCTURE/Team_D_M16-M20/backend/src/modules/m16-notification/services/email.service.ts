/**
 * GNT M16 — Email Service Connector
 * Integrates with M18 gateway.service.ts for external routing
 */

import { SendNotificationPayload } from '../types/notification.types';
import { notificationRepository } from '../repositories/notification.repository';

// Mock M18 integration
const gatewayService = {
  sendViaGateway: async (channel: string, payload: any) => {
    console.log(`[M18 Gateway] Sending via ${channel}:`, payload);
    return { success: true, messageId: `email-${Date.now()}` };
  },
};

class EmailService {
  /**
   * Send notification via Email
   */
  async send(notificationId: string, payload: SendNotificationPayload): Promise<void> {
    const emailPayload = {
      to: payload.userId, // Would resolve to email via M05
      subject: payload.title,
      body: this.buildEmailBody(payload),
      html: this.buildEmailHtml(payload),
      from: 'notifications@gnt.app',
    };

    try {
      const response = await gatewayService.sendViaGateway('email', emailPayload);

      if (response.success) {
        await notificationRepository.updateStatus(notificationId, 'sent');
        await notificationRepository.createDeliveryLog(
          notificationId,
          'email',
          'delivered',
          JSON.stringify(response)
        );
      } else {
        throw new Error('Email gateway returned failure');
      }
    } catch (error) {
      await notificationRepository.createDeliveryLog(
        notificationId,
        'email',
        'failed',
        undefined,
        error instanceof Error ? error.message : 'Email delivery failed'
      );
      throw error;
    }
  }

  /**
   * Build plain text email body
   */
  private buildEmailBody(payload: SendNotificationPayload): string {
    return `
${payload.title}

${payload.message}

---
This is an automated notification from GNT.
Entity: ${payload.entityType}${payload.entityId ? ` | ID: ${payload.entityId}` : ''}
    `.trim();
  }

  /**
   * Build HTML email body
   */
  private buildEmailHtml(payload: SendNotificationPayload): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Inter, sans-serif; background: #F8FAFC; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; padding: 32px; }
    .title { color: #0F172A; font-size: 20px; font-weight: 600; margin-bottom: 16px; }
    .message { color: #64748B; font-size: 14px; line-height: 1.6; }
    .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #E2E8F0; color: #94A3B8; font-size: 12px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 8px; font-size: 12px; font-weight: 500; }
    .badge-normal { background: #EFF6FF; color: #2563EB; }
    .badge-high { background: #FEF3C7; color: #D97706; }
    .badge-urgent { background: #FEE2E2; color: #DC2626; }
  </style>
</head>
<body>
  <div class="container">
    <div class="title">${payload.title}</div>
    <div class="message">${payload.message}</div>
    <div class="footer">
      <span class="badge badge-${payload.priority}">${payload.priority?.toUpperCase()}</span>
      <br><br>
      GNT Notification Engine • M16
    </div>
  </div>
</body>
</html>
    `.trim();
  }
}

export const emailService = new EmailService();
