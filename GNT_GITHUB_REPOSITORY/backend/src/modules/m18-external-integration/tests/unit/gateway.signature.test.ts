/**
 * M18 — Webhook signature validation ki jaanch (shuddh crypto, DB nahi).
 * Razorpay (HMAC-SHA256) · Stripe (t+v1) · Twilio (HMAC-SHA1 fullUrl+params) · default-deny.
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { GatewayService } from '../../services/gateway.service';

const svc = new GatewayService({} as any);
const secret = 'whsec_test_secret';

test('M18 signature: Razorpay — sahi HMAC-SHA256 hex pass, galat fail', () => {
  const rawBody = '{"event":"payment.captured","amount":100}';
  const good = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  assert.equal(svc.validateWebhookSignature('razorpay', rawBody, good, secret), true);
  assert.equal(svc.validateWebhookSignature('razorpay', rawBody, 'deadbeef', secret), false);
});

test('M18 signature: Stripe — fresh t + sahi v1 pass, purana/galat fail', () => {
  const rawBody = '{"type":"invoice.paid"}';
  const t = Math.floor(Date.now() / 1000);
  const v1 = crypto.createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex');
  const header = `t=${t},v1=${v1}`;
  assert.equal(svc.validateWebhookSignature('stripe', rawBody, header, secret), true);

  // galat v1
  assert.equal(svc.validateWebhookSignature('stripe', rawBody, `t=${t},v1=bad`, secret), false);
  // purana t (6 min pehle) — replay रोकना
  const old = Math.floor(Date.now() / 1000) - 6 * 60;
  const oldV1 = crypto.createHmac('sha256', secret).update(`${old}.${rawBody}`).digest('hex');
  assert.equal(svc.validateWebhookSignature('stripe', rawBody, `t=${old},v1=${oldV1}`, secret), false);
});

test('M18 signature: Twilio — HMAC-SHA1(fullUrl + sorted params) base64 pass', () => {
  const fullUrl = 'https://app.example.com/webhook/twilio';
  const rawBody = 'foo=bar&baz=qux';
  // sorted keys: baz, foo → bazqux + foobar
  const expected = crypto.createHmac('sha1', secret).update(fullUrl + 'bazquxfoobar').digest('base64');
  assert.equal(svc.validateWebhookSignature('twilio', rawBody, expected, secret, fullUrl), true);
  assert.equal(svc.validateWebhookSignature('twilio', rawBody, 'forged', secret, fullUrl), false);
});

test('M18 signature: Twilio — fullUrl na ho to default-deny (कभी जाली webhook नहीं)', () => {
  const rawBody = 'foo=bar&baz=qux';
  const any = crypto.createHmac('sha1', secret).update(rawBody).digest('base64');
  assert.equal(svc.validateWebhookSignature('twilio', rawBody, any, secret), false);
});

test('M18 signature: anjaan provider — default HMAC-SHA256 hex', () => {
  const rawBody = 'hello';
  const good = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  assert.equal(svc.validateWebhookSignature('unknown-provider', rawBody, good, secret), true);
  assert.equal(svc.validateWebhookSignature('unknown-provider', rawBody, 'bad', secret), false);
});

test('M18 signature: length mismatch par bhi fail (timingSafeEqual-safe)', () => {
  const rawBody = 'x';
  const short = 'abc'; // wrong length
  assert.equal(svc.validateWebhookSignature('razorpay', rawBody, short, secret), false);
});
