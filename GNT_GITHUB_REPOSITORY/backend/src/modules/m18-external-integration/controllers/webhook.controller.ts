/**
 * M18 — Webhook Controller (HTTP Handlers)
 * Owner: D4-DELTA
 * 
 * Receives webhooks from external providers.
 * Always returns 200 OK to prevent provider retries,
 * even if processing fails (errors logged internally).
 */
import { Request, Response, NextFunction } from 'express';
import { WebhookService } from '../services/webhook.service';
import { webhookProviderParamSchema } from '../validators/integration.schema';

export class WebhookController {
  constructor(private readonly service: WebhookService) {}

  async receiveWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { provider } = webhookProviderParamSchema.parse(req.params);
      const rawBody = JSON.stringify(req.body);

      const result = await this.service.receiveWebhook(provider, {
        payload: req.body,
        headers: req.headers as Record<string, string>,
        raw_body: rawBody,
      });

      res.status(200).json({ received: true, log_id: result.logId });
    } catch (err) {
      // Always return 200 to external webhooks to avoid retries
      console.error('[M18] Webhook processing error:', err);
      res.status(200).json({ received: true, error: 'Processing queued' });
    }
  }
}
