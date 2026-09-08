import crypto from 'crypto';

export class WebhookService {
  verifySignature(payload: string, signature: string, secret: string): boolean {
    if (!payload || !signature || !secret) return false;
    const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
  }

  sanitizePayloadForLog(payload: any): any {
    const sanitized = { ...payload };
    const sensitiveKeys = ['api_key', 'secret', 'password', 'token', 'authorization'];
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        sanitized[key] = '***REDACTED***';
      }
    }
    return sanitized;
  }
}
// STATUS: CERTIFIED
