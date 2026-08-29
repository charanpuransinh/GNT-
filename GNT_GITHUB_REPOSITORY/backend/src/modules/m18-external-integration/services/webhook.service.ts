/**
 * M18 — Webhook Service (Processor)
 * Owner: D4-DELTA
 * 
 * Flow:
 *   validation + signature check
 *   → integration.service.ts (PUBLIC)
 *   → event-bus.ts
 *   → integration.handlers.ts
 *   → M11 payment.service.confirmPayment() (PUBLIC)
 *   → webhook_log (DB)
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
import {
  WEBHOOK_RECEIVED,
  GATEWAY_STATUS_CHANGED,
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
    // 1. Log incoming webhook immediately
    const log = await this.repository.createWebhookLog({
      provider,
      payload: dto.payload,
      headers: dto.headers,
      status: WebhookStatus.RECEIVED,
    });

    try {
      // 2. Find active integration for provider
      const integration = await this.integrationService.findIntegrationByProvider(provider);
      if (!integration) {
        throw new Error(`No integration found for provider: ${provider}`);
      }

      // 3. Signature validation (if secret configured)
      const cfg = integration.config_json as Record<string, string>;
      if (cfg.webhook_secret) {
        const signature = dto.headers['x-razorpay-signature'] 
          ?? dto.headers['stripe-signature'] 
          ?? dto.headers['x-webhook-signature'] 
          ?? '';

        const isValid = this.gatewayService.validateWebhookSignature(
          provider,
          dto.raw_body,
          signature,
          cfg.webhook_secret,
        );
        if (!isValid) {
          throw new Error('Webhook signature validation failed');
        }
      }

      await this.repository.updateWebhookStatus(log.id, WebhookStatus.VALIDATED);

      // 4. Emit event for async processing
      this.eventBus.emit(WEBHOOK_RECEIVED, {
        provider,
        payload: dto.payload,
        webhook_log_id: log.id,
      });

      // 5. Provider-specific synchronous processing
      await this.processProviderWebhook(provider, dto.payload, log.id);

      return { received: true, logId: log.id };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Webhook processing failed';
      await this.repository.updateWebhookStatus(log.id, WebhookStatus.FAILED, msg);
      throw error;
    }
  }

  private async processProviderWebhook(provider: string, payload: Record<string, unknown>, logId: string): Promise<void> {
    const p = provider.toLowerCase();

    if (p.includes('razorpay') || p.includes('stripe')) {
      const event = payload.event as string || payload.type as string;
      const orderId = (payload.payload?.payment?.entity?.order_id as string) 
        ?? (payload.data?.object?.metadata?.order_id as string) 
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
}
