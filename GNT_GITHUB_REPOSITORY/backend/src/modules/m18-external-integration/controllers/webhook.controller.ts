/**
 * M18 — Webhook Controller (HTTP Handlers)
 * Owner: D4-DELTA
 *
 * Receives webhooks from external providers.
 * टास्क #013:
 *   - असली raw body (express.raw) से signature जाँच
 *   - सही status code: स्वीकार→200, signature गलत→401, बेकार payload→400, हमारी गड़बड़→500
 */
import { Request, Response, NextFunction } from 'express';
import { WebhookService } from '../services/webhook.service';
import { webhookProviderParamSchema } from '../validators/integration.schema';
import { AppError } from '@/common/errors/error-classes';

export class WebhookController {
  constructor(private readonly service: WebhookService) {}

  async receiveWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { provider } = webhookProviderParamSchema.parse(req.params);
      // express.raw की वजह से req.body Buffer (असली bytes) होता है
      const rawBody = Buffer.isBuffer(req.body)
        ? req.body.toString('utf8')
        : (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));

      const result = await this.service.receiveWebhook(provider, {
        headers: req.headers as Record<string, string>,
        raw_body: rawBody,
        full_url: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
      });

      res.status(200).json({ received: true, log_id: result.logId });
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ success: false, error: err.message });
        return;
      }
      // हमारी अपनी गड़बड़ — gateway को दोबारा भेजने का मौका देने के लिए 500
      console.error('[M18] Webhook processing error:', err);
      res.status(500).json({ success: false, error: 'Webhook processing failed' });
    }
  }
}
