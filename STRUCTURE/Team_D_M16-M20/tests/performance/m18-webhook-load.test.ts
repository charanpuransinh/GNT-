/**
 * M18 — Webhook Load / Performance Tests
 * Owner: D4-DELTA
 * 
 * Validates throughput and latency under load.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';
import { IntegrationRepository } from '../backend/src/modules/m18-external-integration/repositories/integration.repository';
import { GatewayService } from '../backend/src/modules/m18-external-integration/services/gateway.service';
import { IntegrationService } from '../backend/src/modules/m18-external-integration/services/integration.service';
import { WebhookService } from '../backend/src/modules/m18-external-integration/services/webhook.service';

const prisma = new PrismaClient();
const eventBus = new EventEmitter();

describe('M18 Webhook Load Tests', () => {
  let webhookService: WebhookService;

  beforeAll(async () => {
    const repository = new IntegrationRepository(prisma);
    const gatewayService = new GatewayService(repository);
    const integrationService = new IntegrationService(repository, gatewayService, eventBus);
    webhookService = new WebhookService(repository, gatewayService, integrationService, eventBus);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should process 100 webhooks within 5 seconds', async () => {
    const start = Date.now();
    const promises: Promise<any>[] = [];

    for (let i = 0; i < 100; i++) {
      promises.push(
        webhookService.receiveWebhook('razorpay', {
          payload: { event: 'payment.captured', order_id: `order_${i}` },
          headers: {},
          raw_body: `{"event":"payment.captured","order_id":"order_${i}"}`,
        })
      );
    }

    const results = await Promise.all(promises);
    const duration = Date.now() - start;

    expect(results.length).toBe(100);
    expect(results.every((r) => r.received === true)).toBe(true);
    expect(duration).toBeLessThan(5000);
  });

  it('should maintain sub-100ms average latency for webhook receipt', async () => {
    const latencies: number[] = [];

    for (let i = 0; i < 50; i++) {
      const start = Date.now();
      await webhookService.receiveWebhook('stripe', {
        payload: { type: 'payment_intent.succeeded' },
        headers: {},
        raw_body: '{"type":"payment_intent.succeeded"}',
      });
      latencies.push(Date.now() - start);
    }

    const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    expect(avg).toBeLessThan(100);
  });

  it('should handle burst of 500 concurrent webhooks without data loss', async () => {
    const promises: Promise<{ logId: string }>[] = [];

    for (let i = 0; i < 500; i++) {
      promises.push(
        webhookService.receiveWebhook('generic', {
          payload: { id: i },
          headers: {},
          raw_body: `{"id":${i}}`,
        }).then((r) => ({ logId: r.logId }))
      );
    }

    const results = await Promise.all(promises);
    const uniqueLogIds = new Set(results.map((r) => r.logId));
    expect(uniqueLogIds.size).toBe(500);
  });
});
