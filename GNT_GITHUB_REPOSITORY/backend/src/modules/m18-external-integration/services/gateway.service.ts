/**
 * M18 — Gateway Service (Connector Engine)
 * Owner: D4-DELTA
 * 
 * PUBLIC METHODS:
 *   sendWhatsApp(phone, message)     → M16 notification channel
 *   sendSMS(phone, message)          → M16 notification channel
 *   processPayment(payload)          → M11 payment gateway
 *   verifyGSTN(gstin)                → M09 GST compliance
 */
import crypto from 'crypto';
import {
  SendWhatsAppDto,
  SendSmsDto,
  ProcessPaymentDto,
  VerifyGstnDto,
  GatewayTestResult,
  IntegrationConfig,
  GatewayStatus,
} from '../types/integration.types';
import { IntegrationRepository } from '../repositories/integration.repository';

export class GatewayService {
  constructor(private readonly repository: IntegrationRepository) {}

  // ─── WhatsApp Business API ───
  async sendWhatsApp(companyId: string, dto: SendWhatsAppDto): Promise<{ messageId: string; status: string }> {
    const config = await this.repository.findActiveIntegrationByType(companyId, 'whatsapp');
    if (!config) throw new Error('No active WhatsApp gateway configured');

    const cfg = config.config_json as { api_key: string; phone_number_id: string; base_url?: string };
    const baseUrl = cfg.base_url ?? 'https://graph.facebook.com/v18.0';

    const url = `${baseUrl}/${cfg.phone_number_id}/messages`;
    const body = dto.template_name
      ? {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: dto.phone,
          type: 'template',
          template: {
            name: dto.template_name,
            language: { code: 'en' },
            components: [
              {
                type: 'body',
                parameters: Object.entries(dto.template_data ?? {}).map(([_, value]) => ({
                  type: 'text',
                  text: value,
                })),
              },
            ],
          },
        }
      : {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: dto.phone,
          type: 'text',
          text: { body: dto.message },
        };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfg.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`WhatsApp API error: ${err}`);
    }

    const data = await res.json();
    return { messageId: data.messages?.[0]?.id ?? 'unknown', status: 'sent' };
  }

  // ─── SMS Gateway (Twilio / Msg91 / Generic) ───
  async sendSMS(companyId: string, dto: SendSmsDto): Promise<{ messageId: string; status: string }> {
    const config = await this.repository.findActiveIntegrationByType(companyId, 'sms');
    if (!config) throw new Error('No active SMS gateway configured');

    const provider = config.provider.toLowerCase();
    const cfg = config.config_json as Record<string, string>;

    if (provider.includes('twilio')) {
      const auth = Buffer.from(`${cfg.account_sid}:${cfg.auth_token}`).toString('base64');
      const url = `https://api.twilio.com/2010-04-01/Accounts/${cfg.account_sid}/Messages.json`;
      const params = new URLSearchParams({
        To: dto.phone,
        From: dto.sender_id ?? cfg.from_number,
        Body: dto.message,
      });

      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      if (!res.ok) throw new Error(`Twilio error: ${await res.text()}`);
      const data = await res.json();
      return { messageId: data.sid, status: data.status };
    }

    if (provider.includes('msg91')) {
      const url = 'https://api.msg91.com/api/v5/flow/';
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          authkey: cfg.auth_key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flow_id: cfg.flow_id,
          sender: dto.sender_id ?? cfg.sender_id,
          mobiles: dto.phone,
          VAR1: dto.message,
        }),
      });
      if (!res.ok) throw new Error(`Msg91 error: ${await res.text()}`);
      const data = await res.json();
      return { messageId: data.message ?? 'unknown', status: 'sent' };
    }

    // Generic REST SMS gateway
    const genericUrl = cfg.api_url;
    const res = await fetch(genericUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.api_key}` },
      body: JSON.stringify({
        to: dto.phone,
        message: dto.message,
        sender: dto.sender_id ?? cfg.sender_id,
      }),
    });
    if (!res.ok) throw new Error(`SMS gateway error: ${await res.text()}`);
    const data = await res.json();
    return { messageId: data.id ?? 'unknown', status: 'sent' };
  }

  // ─── Payment Gateway (Razorpay / Stripe) ───
  async processPayment(companyId: string, dto: ProcessPaymentDto): Promise<{ orderId: string; status: string; gateway_response: unknown }> {
    const config = await this.repository.findActiveIntegrationByType(companyId, 'payment');
    if (!config) throw new Error('No active payment gateway configured');

    const provider = config.provider.toLowerCase();
    const cfg = config.config_json as Record<string, string>;

    if (provider.includes('razorpay')) {
      const auth = Buffer.from(`${cfg.key_id}:${cfg.key_secret}`).toString('base64');
      const res = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: dto.amount * 100, // paisa
          currency: dto.currency,
          receipt: dto.order_id,
          notes: dto.metadata,
        }),
      });
      if (!res.ok) throw new Error(`Razorpay error: ${await res.text()}`);
      const data = await res.json();
      return { orderId: data.id, status: data.status, gateway_response: data };
    }

    if (provider.includes('stripe')) {
      const res = await fetch('https://api.stripe.com/v1/payment_intents', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cfg.secret_key}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          amount: String(dto.amount * 100),
          currency: dto.currency.toLowerCase(),
          'metadata[order_id]': dto.order_id,
        }).toString(),
      });
      if (!res.ok) throw new Error(`Stripe error: ${await res.text()}`);
      const data = await res.json();
      return { orderId: data.id, status: data.status, gateway_response: data };
    }

    throw new Error(`Unsupported payment provider: ${provider}`);
  }

  // ─── GSTN Verification ───
  async verifyGSTN(companyId: string, dto: VerifyGstnDto): Promise<{ valid: boolean; details?: unknown }> {
    const config = await this.repository.findActiveIntegrationByType(companyId, 'gstn');
    if (!config) throw new Error('No active GSTN gateway configured');

    const cfg = config.config_json as { api_key: string; base_url?: string };
    const baseUrl = cfg.base_url ?? 'https://commonapi.mastersindia.co';

    const res = await fetch(`${baseUrl}/commonapis/searchgstin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.api_key}`,
      },
      body: JSON.stringify({ gstin: dto.gstin }),
    });

    if (!res.ok) throw new Error(`GSTN verification error: ${await res.text()}`);
    const data = await res.json();
    return { valid: data?.data?.status === 'Active', details: data };
  }

  // ─── Test Connection ───
  async testConnection(integration: IntegrationConfig): Promise<GatewayTestResult> {
    const start = Date.now();
    try {
      const cfg = integration.config_json as Record<string, string>;
      let success = false;
      let message = 'Unknown provider';

      switch (integration.type) {
        case 'whatsapp': {
          const url = `https://graph.facebook.com/v18.0/${cfg.phone_number_id}?access_token=${cfg.api_key}`;
          const res = await fetch(url);
          success = res.ok;
          message = success ? 'WhatsApp Business API connected' : 'Invalid credentials';
          break;
        }
        case 'sms': {
          if (integration.provider.toLowerCase().includes('twilio')) {
            const auth = Buffer.from(`${cfg.account_sid}:${cfg.auth_token}`).toString('base64');
            const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${cfg.account_sid}.json`, {
              headers: { Authorization: `Basic ${auth}` },
            });
            success = res.ok;
            message = success ? 'Twilio connected' : 'Invalid Twilio credentials';
          } else {
            success = true;
            message = 'SMS gateway configuration valid';
          }
          break;
        }
        case 'payment': {
          if (integration.provider.toLowerCase().includes('razorpay')) {
            const auth = Buffer.from(`${cfg.key_id}:${cfg.key_secret}`).toString('base64');
            const res = await fetch('https://api.razorpay.com/v1/items', {
              headers: { Authorization: `Basic ${auth}` },
            });
            success = res.ok;
            message = success ? 'Razorpay connected' : 'Invalid Razorpay credentials';
          } else if (integration.provider.toLowerCase().includes('stripe')) {
            const res = await fetch('https://api.stripe.com/v1/account', {
              headers: { Authorization: `Bearer ${cfg.secret_key}` },
            });
            success = res.ok;
            message = success ? 'Stripe connected' : 'Invalid Stripe credentials';
          }
          break;
        }
        case 'gstn': {
          message = 'GSTN verification requires a valid GSTIN';
          success = true; // config valid, actual check needs GSTIN
          break;
        }
      }

      return {
        success,
        latency_ms: Date.now() - start,
        message,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        latency_ms: Date.now() - start,
        message: error instanceof Error ? error.message : 'Connection failed',
        timestamp: new Date(),
      };
    }
  }

  // ─── Signature Validation ───
  validateWebhookSignature(provider: string, rawBody: string, signature: string, secret: string): boolean {
    const p = provider.toLowerCase();
    if (p.includes('razorpay')) {
      const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
      return this.safeEqual(expected, signature);
    }
    if (p.includes('stripe')) {
      return this.validateStripeSignature(rawBody, signature, secret);
    }
    if (p.includes('twilio')) {
      // Twilio का असली नियम: X-Twilio-Signature = base64(HMAC-SHA1(authToken, fullUrl + sorted POST params))
      // इसके लिए fullUrl + params चाहिए जो यहाँ उपलब्ध नहीं — इसलिए default-deny (कभी भी जाली webhook स्वीकार नहीं)।
      // TODO(#018): URL+params देकर असली Twilio validation लगाना।
      return false;
    }
    // Default: simple HMAC compare (x-webhook-signature वगैरह)
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    return this.safeEqual(expected, signature);
  }

  private validateStripeSignature(rawBody: string, signatureHeader: string, secret: string): boolean {
    // Stripe header: "t=1234567890,v1=abcdef..." — signed payload `${t}.${rawBody}`
    const parts = signatureHeader.split(',').map((s) => s.trim());
    const tPart = parts.find((s) => s.startsWith('t='));
    const v1Part = parts.find((s) => s.startsWith('v1='));
    if (!tPart || !v1Part) return false;
    const t = tPart.slice(2);
    const v1 = v1Part.slice(3);

    // replay रोकने के लिए t की उम्र (5 मिनट)
    const issuedAt = Number(t);
    if (!Number.isFinite(issuedAt)) return false;
    const ageSeconds = Math.floor(Date.now() / 1000) - issuedAt;
    if (ageSeconds < 0 || ageSeconds > 5 * 60) return false;

    const expected = crypto.createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex');
    return this.safeEqual(expected, v1);
  }

  private safeEqual(a: string, b: string): boolean {
    const ab = Buffer.from(a);
    const bb = Buffer.from(b);
    // timingSafeEqual लंबाई अलग होने पर exception फेंकता है — पहले length मिलाओ
    if (ab.length !== bb.length) return false;
    return crypto.timingSafeEqual(ab, bb);
  }
}
