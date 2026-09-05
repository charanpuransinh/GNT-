// ============================================================================
// M16 — Secure Order Link (HMAC-signed token)
//
// SPEC-B: buyer को एक ऐसा link मिलता है जिसे वह बिना login खोल सकता है।
// link ही उसकी पहचान है — HMAC-SHA256 signature + expiry। बिना सही signature
// या expired link पर कुछ नहीं मिलेगा (fail-closed)।
// ============================================================================

import { createHmac, timingSafeEqual } from 'crypto';

function secret(): string {
  const s = process.env.M16_ORDER_LINK_SECRET;
  if (!s) {
    // fail-closed: link का signature ही बिना-login पहचान है — बिना secret के
    // चुपचाप कोई सार्वजनिक/dev key नहीं बनेगी (M02 वाली गलती नहीं दोहराई)।
    throw new Error('M16_ORDER_LINK_SECRET not configured — refusing to sign/verify order links');
  }
  return s;
}

function b64url(data: string): string {
  return Buffer.from(data).toString('base64url');
}

export interface OrderLinkPayload {
  /** campaign id */
  c: string;
  /** party id */
  p: string;
  /** expiry (epoch ms) */
  e: number;
}

export function signOrderLink(payload: OrderLinkPayload): string {
  const data = b64url(JSON.stringify(payload));
  const sig = createHmac('sha256', secret()).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verifyOrderLink(token: string): OrderLinkPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  const expected = createHmac('sha256', secret()).update(data).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (typeof payload.c !== 'string' || typeof payload.p !== 'string' || typeof payload.e !== 'number') return null;
    if (Date.now() > payload.e) return null; // expired
    return payload as OrderLinkPayload;
  } catch {
    return null;
  }
}
