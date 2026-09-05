// ============================================================================
// M22 — Subscription HTTP + tenant isolation (DB-gated)
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, registerModules } from '../../../../app';
import { prisma } from '@/common/config/prisma';
import { TEST_USER_ID, mintBearer } from '@/tests/helpers/auth';

const COMPANY_ID = '00000000-0000-4000-8000-000000000095';
const OTHER_ID = '00000000-0000-4000-8000-000000000094';
const auth = () => mintBearer(COMPANY_ID, TEST_USER_ID);
const authOther = () => mintBearer(OTHER_ID, TEST_USER_ID);

async function cleanup() {
  await prisma.companySubscription.deleteMany({ where: { companyId: { in: [COMPANY_ID, OTHER_ID] } } });
  await prisma.subscriptionPlan.deleteMany({ where: { code: { in: ['HTTP-BASIC'] } } });
}

describe.runIf(process.env.TEST_DB === '1')('M22 subscription HTTP — live DB', () => {
  beforeAll(async () => {
    await registerModules();
    await prisma.company_master.upsert({ where: { id: COMPANY_ID }, update: { name: 'Sub Co' }, create: { id: COMPANY_ID, name: 'Sub Co', code: 'SUBCO2' } });
    await prisma.company_master.upsert({ where: { id: OTHER_ID }, update: { name: 'Sub Other' }, create: { id: OTHER_ID, name: 'Sub Other', code: 'SUBOT2' } });
    await cleanup();
  });

  afterAll(cleanup);

  it('plan create → subscribe → active (HTTP)', async () => {
    const plan = await request(app)
      .post('/api/v1/subscriptions/plans')
      .set('Authorization', auth())
      .send({ code: 'HTTP-BASIC', name: 'Basic', priceMonthly: 299, priceYearly: 2999 });
    expect(plan.status).toBe(201);
    const planId = plan.body.data.id;

    const sub = await request(app)
      .post('/api/v1/subscriptions/subscribe')
      .set('Authorization', auth())
      .send({ planId });
    expect(sub.status).toBe(201);
    expect(sub.body.data.planId).toBe(planId);

    const active = await request(app).get('/api/v1/subscriptions/active').set('Authorization', auth());
    expect(active.status).toBe(200);
    expect(active.body.data.planId).toBe(planId);
  });

  it('tenant isolation: doosri company ki subscription nahi dikhti', async () => {
    const active = await request(app).get('/api/v1/subscriptions/active').set('Authorization', authOther());
    expect(active.status).toBe(200);
    expect(active.body.data).toBeNull();
  });
});
