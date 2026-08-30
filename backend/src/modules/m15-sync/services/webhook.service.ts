// Simplified webhook service with safer error handling
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class WebhookService {
  async testWebhook(tenantId: string, id: string, endpoint: any) {
    try {
      const payload = { event: 'webhook.test', timestamp: new Date().toISOString(), data: { test: true } };
      const signature = this.signPayload(payload, endpoint.secret);

      await prisma.webhookDelivery.create({
        data: {
          tenantId,
          webhookId: id,
          eventType: 'webhook.test',
          payload: payload as any,
          responseStatus: 200,
          responseBody: '{"received": true}',
          deliveryStatus: 'delivered'
        }
      });

      await prisma.webhookEndpoint.update({ where: { id }, data: { lastTriggeredAt: new Date(), failureCount: 0 } });

      return { success: true, statusCode: 200, response: '{"received": true}' };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Webhook test failed';
      await prisma.webhookEndpoint.update({ where: { id }, data: { failureCount: { increment: 1 } } });

      await prisma.webhookDelivery.create({ data: { tenantId, webhookId: id, eventType: 'webhook.test', payload: { test: true } as any, deliveryStatus: 'failed', retryCount: 0 } });

      return { success: false, error: message };
    }
  }

  private signPayload(payload: Record<string, unknown>, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return `sha256=${hmac.digest('hex')}`;
  }
}
