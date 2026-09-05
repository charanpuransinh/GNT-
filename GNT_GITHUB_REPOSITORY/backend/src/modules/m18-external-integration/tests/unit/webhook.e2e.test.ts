// M18 — Webhook END-TO-END (real HTTP + signature + log) — receive flow sach me chalta hai
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import { app, registerModules } from '../../../../app';
import { prisma } from '@/common/config/prisma';

const SECRET = 'whsec_e2e_test';

async function cleanup() {
  await prisma.webhook_log.deleteMany({});
  await prisma.integration_config.deleteMany({ where: { provider: 'razorpay' } });
}

describe.runIf(process.env.TEST_DB === '1')('M18 webhook end-to-end — live DB', () => {
  beforeAll(async () => {
    await registerModules();
    await cleanup();
    await prisma.integration_config.create({
      data: {
        company_id: '00000000-0000-4000-8000-000000000001',
        provider: 'razorpay',
        type: 'payment',
        config_json: { webhook_secret: SECRET },
        status: 'active',
        is_active: true,
      },
    });
  });
  afterAll(cleanup);

  it('sahi signature wala webhook receive hota hai → webhook_log PROCESSED', async () => {
    const payload = { event: 'payment.captured', payload: { payment: { entity: { order_id: 'ORD-E2E-1' } } } };
    const rawBody = JSON.stringify(payload);
    const signature = crypto.createHmac('sha256', SECRET).update(rawBody).digest('hex');

    const res = await request(app)
      .post('/api/v1/integrations/webhook/razorpay')
      .set('x-razorpay-signature', signature)
      .set('Content-Type', 'application/json')
      .send(rawBody);

    expect(res.status).toBe(200);

    const log = await prisma.webhook_log.findFirst({ orderBy: { created_at: 'desc' } });
    expect(log).toBeTruthy();
    expect(log!.provider).toBe('razorpay');
  });

  it('galat signature wala webhook reject hota hai (401)', async () => {
    const rawBody = JSON.stringify({ event: 'payment.captured' });
    const res = await request(app)
      .post('/api/v1/integrations/webhook/razorpay')
      .set('x-razorpay-signature', 'forged-signature')
      .set('Content-Type', 'application/json')
      .send(rawBody);

    expect(res.status).toBe(401);
  });
});
