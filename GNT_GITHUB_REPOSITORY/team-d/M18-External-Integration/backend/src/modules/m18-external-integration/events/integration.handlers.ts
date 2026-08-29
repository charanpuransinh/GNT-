/**
 * M18 — Event Consumers / Handlers
 * Owner: D4-DELTA
 * 
 * Consumes from Event Bus and routes to appropriate modules.
 */
import { EventEmitter } from 'events';
import {
  WebhookReceivedEvent,
  GatewayStatusChangedEvent,
  PaymentWebhookEvent,
} from '../types/integration.types';
import {
  WEBHOOK_RECEIVED,
  GATEWAY_STATUS_CHANGED,
  PAYMENT_WEBHOOK_SUCCESS,
  PAYMENT_WEBHOOK_FAILED,
} from './integration.events';

export class IntegrationEventHandlers {
  constructor(private readonly eventBus: EventEmitter) {}

  register(): void {
    this.eventBus.on(WEBHOOK_RECEIVED, this.handleWebhookReceived.bind(this));
    this.eventBus.on(GATEWAY_STATUS_CHANGED, this.handleGatewayStatusChanged.bind(this));
    this.eventBus.on(PAYMENT_WEBHOOK_SUCCESS, this.handlePaymentSuccess.bind(this));
    this.eventBus.on(PAYMENT_WEBHOOK_FAILED, this.handlePaymentFailed.bind(this));
  }

  private handleWebhookReceived(event: WebhookReceivedEvent): void {
    console.log(`[M18] Webhook received from ${event.provider}, log_id=${event.webhook_log_id}`);
    // Internal audit / logging only — actual processing done in WebhookService
  }

  private handleGatewayStatusChanged(event: GatewayStatusChangedEvent): void {
    console.log(`[M18] Gateway ${event.provider} status changed: ${event.previous_status} → ${event.current_status}`);
    // Forward to M19 monitoring if needed
    // this.eventBus.emit('monitoring.gateway.alert', event); // M19 interface
  }

  private handlePaymentSuccess(event: PaymentWebhookEvent): void {
    console.log(`[M18] Payment success for order ${event.order_id} via ${event.gateway}`);
    // → M11 payment.service.confirmPayment() (PUBLIC)
    // This should be called via M11's public API, not directly
    // Example: await m11PaymentService.confirmPayment(event.order_id, event.payload);
  }

  private handlePaymentFailed(event: PaymentWebhookEvent): void {
    console.log(`[M18] Payment failed for order ${event.order_id} via ${event.gateway}`);
    // → M16 alert notification (PUBLIC)
    // Example: await m16NotificationService.sendAlert('payment_failed', event);
  }
}
