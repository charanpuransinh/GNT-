// ============================================================================
// M13 — WEBHOOK action का SSRF guard (असली DB पर, POST /rules/:id/trigger)
//
// पहले: कोई भी tenant अपने automation rule के WEBHOOK action में मनचाहा url डाल
// सकता था — private/internal network पते (cloud metadata endpoint, localhost
// की सेवाएँ) भी। server ख़ुद वहाँ request करता, कोई जाँच नहीं थी।
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, registerModules } from '../../../app';
import { prisma } from '@/common/config/prisma';
import { TEST_COMPANY_ID, mintBearer } from '@/tests/helpers/auth';

describe.runIf(process.env.TEST_DB === '1')('M13 — WEBHOOK action SSRF guard', () => {
  const ruleIds: string[] = [];

  beforeAll(async () => {
    await registerModules();
    await prisma.company_master.upsert({
      where: { id: TEST_COMPANY_ID },
      update: {},
      create: { id: TEST_COMPANY_ID, name: 'Test Company', code: 'TESTCO' },
    });
  });

  afterAll(async () => {
    await prisma.jobExecutionLog.deleteMany({ where: { ruleId: { in: ruleIds } } });
    await prisma.automationRule.deleteMany({ where: { id: { in: ruleIds } } });
  });

  async function makeWebhookRule(url: string) {
    const res = await request(app).post('/api/v1/automation/rules').set('Authorization', mintBearer()).send({
      name: `Webhook rule ${Date.now()}`,
      triggerType: 'MANUAL',
      actions: [{ type: 'WEBHOOK', config: { url } }],
    });
    ruleIds.push(res.body.data.id);
    return res.body.data.id;
  }

  it('🔒 localhost पर webhook रुकता है', async () => {
    const id = await makeWebhookRule('https://localhost:9999/x');
    const res = await request(app).post(`/api/v1/automation/rules/${id}/trigger`).set('Authorization', mintBearer()).send({});
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/निजी|internal/);
  });

  it('🔒 cloud metadata पते (169.254.x.x) पर webhook रुकता है', async () => {
    const id = await makeWebhookRule('https://169.254.169.254/latest/meta-data/');
    const res = await request(app).post(`/api/v1/automation/rules/${id}/trigger`).set('Authorization', mintBearer()).send({});
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/निजी|internal/);
  });

  it('🔒 निजी नेटवर्क रेंज (10.x/192.168.x/172.16-31.x) पर webhook रुकता है', async () => {
    for (const host of ['https://10.0.0.5/x', 'https://192.168.1.1/x', 'https://172.20.0.1/x']) {
      const id = await makeWebhookRule(host);
      const res = await request(app).post(`/api/v1/automation/rules/${id}/trigger`).set('Authorization', mintBearer()).send({});
      expect(res.body.success).toBe(false);
    }
  });

  it('🔒 http:// (non-https) पर webhook रुकता है', async () => {
    const id = await makeWebhookRule('http://example.com/x');
    const res = await request(app).post(`/api/v1/automation/rules/${id}/trigger`).set('Authorization', mintBearer()).send({});
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/https/);
  });

  it('🔒 url में credentials (user:pass@) मना हैं', async () => {
    const id = await makeWebhookRule('https://user:pass@example.com/x');
    const res = await request(app).post(`/api/v1/automation/rules/${id}/trigger`).set('Authorization', mintBearer()).send({});
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/credentials/);
  });
});
