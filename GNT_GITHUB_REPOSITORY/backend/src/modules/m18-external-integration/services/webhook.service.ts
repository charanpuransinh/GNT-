/**
 * M18 — Webhook Service (Processor)
 * Owner: D4-DELTA
 *
 * Flow:
 *   signature check (raw body) → JSON parse → dedup → validation
 *   → integration.service.ts (PUBLIC) → event-bus.ts → integration.handlers.ts
 *   → M11 payment.service.confirmPayment() (PUBLIC) → webhook_log (DB)
 *
 * टास्क #013 में security hardening:
 *   - secret न हो तो default-deny
 *   - signature जाँच पहले, JSON parse बाद में (असली raw bytes पर)
 *   - event id से dedup (एक webhook दो बार न चले)
 */
import { EventEmitter } from 'events';
import {
  ReceiveWebhookDto,
  WebhookLog,
  WebhookStatus,
  PaymentWebhookEvent,
} from '../types/integration.types';
import { IntegrationRepository } from '../repositories/integration.repository';
import { GatewayService } from './gateway.service';
import { IntegrationService } from './integration.service';
import { AppError } from '@/common/errors/error-classes';
import {
  WEBHOOK_RECEIVED,
  PAYMENT_WEBHOOK_SUCCESS,
  PAYMENT_WEBHOOK_FAILED,
} from '../events/integration.events';

export class WebhookService {
  constructor(
    private readonly repository: IntegrationRepository,
    private readonly gatewayService: GatewayService,
    private readonly integrationService: IntegrationService,
    private readonly eventBus: EventEmitter,
  ) {}

  async receiveWebhook(provider: string, dto: ReceiveWebhookDto): Promise<{ received: boolean; logId: string }> {
    // 1. Find active integration for provider
    const integration = await this.integrationService.findIntegrationByProvider(provider);
    if (!integration) {
      throw new AppError('GNT-ERR-1801', `No integration found for provider: ${provider}`, 404);
    }

    const cfg = integration.config_json as Record<string, string>;

    // 2. default-deny: secret न हो → webhook अस्वीकार (बिना शर्त स्वीकार कभी नहीं)
    if (!cfg.webhook_secret) {
      throw new AppError('GNT-ERR-1802', 'Webhook secret not configured — rejecting (default-deny)', 401);
    }

    // 3. Signature validation — असली raw body पर, JSON parse से पहले
    const signature = dto.headers['x-razorpay-signature']
      ?? dto.headers['stripe-signature']
      ?? dto.headers['x-webhook-signature']
      ?? '';
    const isValid = this.gatewayService.validateWebhookSignature(provider, dto.raw_body, signature, cfg.webhook_secret, dto.full_url);
    if (!isValid) {
      throw new AppError('GNT-ERR-1803', 'Webhook signature validation failed', 401);
    }

    // 4. JSON parse (बेकार payload → 400)
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(dto.raw_body) as Record<string, unknown>;
    } catch {
      throw new AppError('GNT-ERR-1804', 'Webhook payload is not valid JSON', 400);
    }

    // 5. dedup — एक ही webhook दो बार न चले
    const eventId = this.extractEventId(provider, payload, dto.headers);
    if (eventId) {
      const existing = await this.repository.findWebhookByEventId(provider, eventId);
      if (existing) {
        return { received: true, logId: existing.id };
      }
    }

    // 6. Log incoming webhook (event id सहित)
    const log = await this.repository.createWebhookLog({
      provider,
      event_id: eventId ?? null,
      payload,
      headers: dto.headers,
      status: WebhookStatus.RECEIVED,
    });

    try {
      await this.repository.updateWebhookStatus(log.id, WebhookStatus.VALIDATED);

      // 7. Emit event for async processing
      this.eventBus.emit(WEBHOOK_RECEIVED, {
        provider,
        payload,
        webhook_log_id: log.id,
      });

      // 8. Provider-specific synchronous processing
      await this.processProviderWebhook(provider, payload, log.id);

      return { received: true, logId: log.id };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Webhook processing failed';
      await this.repository.updateWebhookStatus(log.id, WebhookStatus.FAILED, msg);
      throw error;
    }
  }

  private extractEventId(provider: string, payload: Record<string, unknown>, headers: Record<string, string>): string | null {
    const p = provider.toLowerCase();
    if (p.includes('razorpay')) {
      const fromHeader = headers['x-razorpay-event-id'];
      if (fromHeader) return fromHeader;
      return typeof payload.event === 'string' ? payload.event : null;
    }
    if (p.includes('stripe')) {
      return typeof payload.id === 'string' ? payload.id : null;
    }
    return null;
  }

  private async processProviderWebhook(provider: string, payload: Record<string, unknown>, logId: string): Promise<void> {
    const p = provider.toLowerCase();

    if (p.includes('razorpay') || p.includes('stripe')) {
      const event = payload.event as string || payload.type as string;
      const orderId = (this.pick(payload, 'payload', 'payment', 'entity', 'order_id') as string)
        ?? (this.pick(payload, 'data', 'object', 'metadata', 'order_id') as string)
        ?? '';

      if (event === 'payment.captured' || event === 'payment_intent.succeeded') {
        const paymentEvent: PaymentWebhookEvent = {
          gateway: provider,
          order_id: orderId,
          status: 'success',
          payload,
        };
        this.eventBus.emit(PAYMENT_WEBHOOK_SUCCESS, paymentEvent);
        await this.repository.updateWebhookStatus(logId, WebhookStatus.PROCESSED);
      } else if (event === 'payment.failed' || event === 'payment_intent.payment_failed') {
        const paymentEvent: PaymentWebhookEvent = {
          gateway: provider,
          order_id: orderId,
          status: 'failed',
          payload,
        };
        this.eventBus.emit(PAYMENT_WEBHOOK_FAILED, paymentEvent);
        await this.repository.updateWebhookStatus(logId, WebhookStatus.PROCESSED);
      }
      return;
    }

    // Generic webhook — mark processed
    await this.repository.updateWebhookStatus(logId, WebhookStatus.PROCESSED);
  }

  private pick(obj: unknown, ...path: string[]): unknown {
    let current: unknown = obj;
    for (const key of path) {
      if (current === null || current === undefined || typeof current !== 'object') return undefined;
      current = (current as Record<string, unknown>)[key];
    }
    return current;
  }
}
