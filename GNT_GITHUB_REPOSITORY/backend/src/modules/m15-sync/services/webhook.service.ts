// M15 Sync Module — Webhook Service
// ⛔ टास्क #008 का फैसला: webhookEndpoint/webhookDelivery M15 की चीज़ नहीं — M18 की है।
// इसलिए यहाँ prisma.webhook* के नए models नहीं बनाए गए; service अब एक साफ़ stub है
// जो ज़ोर से बताता है कि webhook का असली काम M18 में जाएगा (चुपचाप ग़लत कुछ नहीं)।
import { WebhookEndpoint, WebhookDelivery, CreateWebhookDTO, WebhookEvent } from '../types/sync.types';
import { AppError } from '../utils/sync.errors';

const NOT_HERE = (): never => {
  throw new AppError('WEBHOOK_IS_M18', 'Webhook endpoints/deliveries belong to M18 (External Integration), not M15', 501);
};

export class WebhookService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_prisma: unknown, _eventEmitter: unknown) {}

  async getAllEndpoints(_tenantId: string): Promise<WebhookEndpoint[]> {
    return NOT_HERE();
  }
  async createEndpoint(_tenantId: string, _dto: CreateWebhookDTO): Promise<WebhookEndpoint> {
    return NOT_HERE();
  }
  async updateEndpoint(_tenantId: string, _id: string, _dto: Partial<CreateWebhookDTO>): Promise<WebhookEndpoint> {
    return NOT_HERE();
  }
  async deleteEndpoint(_tenantId: string, _id: string): Promise<void> {
    return NOT_HERE();
  }
  async toggleEndpoint(_tenantId: string, _id: string): Promise<WebhookEndpoint> {
    return NOT_HERE();
  }
  async getDeliveries(_tenantId: string, _webhookId: string, _opts: { page: number; limit: number }): Promise<{ deliveries: WebhookDelivery[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
    return NOT_HERE();
  }
  async testEndpoint(_tenantId: string, _id: string): Promise<{ success: boolean; statusCode?: number; response?: string; error?: string }> {
    return NOT_HERE();
  }
  async triggerWebhook(_tenantId: string, _event: WebhookEvent, _payload: Record<string, unknown>): Promise<void> {
    return NOT_HERE();
  }
}
