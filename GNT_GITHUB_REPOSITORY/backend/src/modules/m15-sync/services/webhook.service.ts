// M15 Sync Module — Webhook Service
// GNT Team C | Modular Monolith Architecture

import { PrismaClient } from '@prisma/client';
import { WebhookEndpoint, CreateWebhookDTO, WebhookEvent, WebhookDelivery } from '../types/sync.types';
import { AppError } from '../utils/sync.errors';
import { EventEmitter } from '../events/sync.emitter';
import crypto from 'crypto';

export class WebhookService {
  constructor(private prisma: PrismaClient, private eventEmitter: EventEmitter) {}

  async getAllEndpoints(tenantId: string): Promise<WebhookEndpoint[]> {
    return this.prisma.webhookEndpoint.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' }
    }) as Promise<WebhookEndpoint[]>;
  }

  async createEndpoint(tenantId: string, dto: CreateWebhookDTO): Promise<WebhookEndpoint> {
    const endpoint = await this.prisma.webhookEndpoint.create({
      data: {
        tenantId,
        name: dto.name,
        url: dto.url,
        secret: dto.secret,
        events: dto.events
      }
    }) as WebhookEndpoint;

    this.eventEmitter.emit('webhook.created', { tenantId, webhookId: endpoint.id });
    return endpoint;
  }

  async updateEndpoint(tenantId: string, id: string, dto: Partial<CreateWebhookDTO>): Promise<WebhookEndpoint> {
    const existing = await this.prisma.webhookEndpoint.findFirst({ where: { id, tenantId } });
    if (!existing) throw new AppError('WEBHOOK_NOT_FOUND', 'Webhook endpoint not found', 404);

    const endpoint = await this.prisma.webhookEndpoint.update({
      where: { id },
      data: {
        name: dto.name,
        url: dto.url,
        secret: dto.secret,
        events: dto.events
      }
    }) as WebhookEndpoint;

    this.eventEmitter.emit('webhook.updated', { tenantId, webhookId: id });
    return endpoint;
  }

  async deleteEndpoint(tenantId: string, id: string): Promise<void> {
    const existing = await this.prisma.webhookEndpoint.findFirst({ where: { id, tenantId } });
    if (!existing) throw new AppError('WEBHOOK_NOT_FOUND', 'Webhook endpoint not found', 404);

    await this.prisma.webhookEndpoint.delete({ where: { id } });
    this.eventEmitter.emit('webhook.deleted', { tenantId, webhookId: id });
  }

  async toggleEndpoint(tenantId: string, id: string): Promise<WebhookEndpoint> {
    const existing = await this.prisma.webhookEndpoint.findFirst({ where: { id, tenantId } });
    if (!existing) throw new AppError('WEBHOOK_NOT_FOUND', 'Webhook endpoint not found', 404);

    const endpoint = await this.prisma.webhookEndpoint.update({
      where: { id },
      data: { isActive: !existing.isActive }
    }) as WebhookEndpoint;

    return endpoint;
  }

  async getDeliveries(tenantId: string, webhookId: string, opts: { page: number; limit: number }) {
    const { page, limit } = opts;
    const skip = (page - 1) * limit;

    const [deliveries, total] = await Promise.all([
      this.prisma.webhookDelivery.findMany({
        where: { tenantId, webhookId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.webhookDelivery.count({ where: { tenantId, webhookId } })
    ]);

    return { deliveries, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async testEndpoint(tenantId: string, id: string): Promise<{ success: boolean; statusCode?: number; response?: string; error?: string }> {
    const endpoint = await this.prisma.webhookEndpoint.findFirst({ where: { id, tenantId } });
    if (!endpoint) throw new AppError('WEBHOOK_NOT_FOUND', 'Webhook endpoint not found', 404);

    try {
      // Simulate webhook test
      const payload = { event: 'webhook.test', timestamp: new Date().toISOString(), data: { test: true } };
      const signature = this.signPayload(payload, endpoint.secret);

      // In real implementation, this would make an HTTP POST request
      // For now, simulate success
      await this.prisma.webhookDelivery.create({
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

      await this.prisma.webhookEndpoint.update({
        where: { id },
        data: { lastTriggeredAt: new Date(), failureCount: 0 }
      });

      return { success: true, statusCode: 200, response: '{"received": true}' };
    } catch (error: any) {
      await this.prisma.webhookEndpoint.update({
        where: { id },
        data: { failureCount: { increment: 1 } }
      });

      await this.prisma.webhookDelivery.create({
        data: {
          tenantId,
          webhookId: id,
          eventType: 'webhook.test',
          payload: { test: true } as any,
          deliveryStatus: 'failed',
          retryCount: 0
        }
      });

      return { success: false, error: error.message };
    }
  }

  async triggerWebhook(tenantId: string, event: WebhookEvent, payload: Record<string, unknown>): Promise<void> {
    const endpoints = await this.prisma.webhookEndpoint.findMany({
      where: { tenantId, isActive: true, events: { has: event } }
    });

    for (const endpoint of endpoints) {
      await this.deliverWebhook(tenantId, endpoint.id, event, payload, endpoint.secret, endpoint.url);
    }
  }

  private async deliverWebhook(
    tenantId: string, webhookId: string, event: WebhookEvent,
    payload: Record<string, unknown>, secret: string, url: string
  ): Promise<void> {
    const signedPayload = this.signPayload(payload, secret);

    try {
      // In real implementation: fetch(url, { method: 'POST', headers: { 'X-Webhook-Signature': signedPayload }, body: JSON.stringify(payload) })
      // Simulated delivery
      await this.prisma.webhookDelivery.create({
        data: {
          tenantId,
          webhookId,
          eventType: event,
          payload: payload as any,
          responseStatus: 200,
          deliveryStatus: 'delivered'
        }
      });

      await this.prisma.webhookEndpoint.update({
        where: { id: webhookId },
        data: { lastTriggeredAt: new Date(), failureCount: 0 }
      });
    } catch (error: any) {
      await this.prisma.webhookDelivery.create({
        data: {
          tenantId,
          webhookId,
          eventType: event,
          payload: payload as any,
          deliveryStatus: 'failed',
          retryCount: 1
        }
      });

      await this.prisma.webhookEndpoint.update({
        where: { id: webhookId },
        data: { failureCount: { increment: 1 } }
      });
    }
  }

  private signPayload(payload: Record<string, unknown>, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return `sha256=${hmac.digest('hex')}`;
  }
}
