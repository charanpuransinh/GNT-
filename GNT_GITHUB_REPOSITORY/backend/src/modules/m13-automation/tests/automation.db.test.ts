// ============================================================================
// M13 — Automation DB-gated integration test (live PostgreSQL, TEST_DB=1)
// rules CRUD + manual trigger + schedule + tenant isolation
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, registerModules } from '../../../app';
import { prisma } from '@/common/config/prisma';
import { TEST_COMPANY_ID, TEST_USER_ID, mintBearer } from '@/tests/helpers/auth';
import { eventBus } from '@/common/events/event-bus';

const OTHER_COMPANY_ID = '00000000-0000-4000-8000-000000000099';

async function cleanupTenant(tenantId: string) {
  await prisma.jobExecutionLog.deleteMany({ where: { tenantId } });
  await prisma.scheduledJob.deleteMany({ where: { tenantId } });
  await prisma.automationRule.deleteMany({ where: { tenantId } });
}

describe.runIf(process.env.TEST_DB === '1')('M13 Automation — live DB', () => {
  let ruleId = '';
  let scheduleId = '';

  beforeAll(async () => {
    await registerModules();
    await prisma.company_master.upsert({
      where: { id: TEST_COMPANY_ID },
      update: { name: 'Test Company' },
      create: { id: TEST_COMPANY_ID, name: 'Test Company', code: 'TESTCO' },
    });
    await prisma.company_master.upsert({
      where: { id: OTHER_COMPANY_ID },
      update: { name: 'Other Company' },
      create: { id: OTHER_COMPANY_ID, name: 'Other Company', code: 'OTHERCO' },
    });
    await cleanupTenant(TEST_COMPANY_ID);
    await cleanupTenant(OTHER_COMPANY_ID);
  });

  afterAll(async () => {
    await cleanupTenant(TEST_COMPANY_ID);
    await cleanupTenant(OTHER_COMPANY_ID);
  });

  it('बिना token GET /api/v1/automation/rules → 401', async () => {
    const res = await request(app).get('/api/v1/automation/rules');
    expect(res.status).toBe(401);
  });

  it('POST /rules → rule बनता है (LOG action)', async () => {
    const res = await request(app)
      .post('/api/v1/automation/rules')
      .set('Authorization', mintBearer())
      .send({
        name: 'Test rule',
        triggerType: 'MANUAL',
        actions: [{ type: 'LOG', config: { message: 'hello {{name}}' } }],
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeTruthy();
    ruleId = res.body.data.id;
  });

  it('POST /rules/:id/trigger → action चलता है और SUCCESS log बनता है', async () => {
    const res = await request(app)
      .post(`/api/v1/automation/rules/${ruleId}/trigger`)
      .set('Authorization', mintBearer())
      .send({ payload: { name: 'world' } });
    expect(res.status).toBe(200);
    expect(res.body.data.ok).toBe(true);
    expect(res.body.data.message).toContain('hello world');

    const log = await prisma.jobExecutionLog.findFirst({ where: { tenantId: TEST_COMPANY_ID, ruleId } });
    expect(log).not.toBeNull();
    expect(log!.status).toBe('SUCCESS');
  });

  it('GET /rules → सिर्फ़ अपनी company के rules', async () => {
    const res = await request(app)
      .get('/api/v1/automation/rules')
      .set('Authorization', mintBearer());
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.every((r: { tenantId: string }) => r.tenantId === TEST_COMPANY_ID)).toBe(true);
  });

  it('दूसरी company rule पढ़ न पाए (tenant isolation read)', async () => {
    const res = await request(app)
      .get(`/api/v1/automation/rules/${ruleId}`)
      .set('Authorization', mintBearer(OTHER_COMPANY_ID, TEST_USER_ID));
    expect(res.status).toBe(404);
  });

  it('दूसरी company rule delete न कर पाए (tenant isolation write)', async () => {
    const res = await request(app)
      .delete(`/api/v1/automation/rules/${ruleId}`)
      .set('Authorization', mintBearer(OTHER_COMPANY_ID, TEST_USER_ID));
    expect(res.status).toBe(404);
    const still = await prisma.automationRule.findFirst({ where: { id: ruleId, tenantId: TEST_COMPANY_ID } });
    expect(still).not.toBeNull();
  });

  it('POST /schedules → schedule बनता है और run करने पर execution log बनता है', async () => {
    const sched = await request(app)
      .post('/api/v1/automation/schedules')
      .set('Authorization', mintBearer())
      .send({ ruleId, name: 'हर मिनट', cronExpr: '* * * * *', payload: { name: 'schedule' } });
    expect(sched.status).toBe(201);
    scheduleId = sched.body.data.id;

    const run = await request(app)
      .post(`/api/v1/automation/schedules/${scheduleId}/run`)
      .set('Authorization', mintBearer());
    expect(run.status).toBe(200);

    const execs = await request(app)
      .get(`/api/v1/automation/schedules/${scheduleId}/executions`)
      .set('Authorization', mintBearer());
    expect(execs.status).toBe(200);
    expect(execs.body.data.length).toBeGreaterThanOrEqual(1);
    expect(execs.body.data[0].status).toBe('SUCCESS');
  });

  it('EVENT rule साझा bus से चलता है', async () => {
    const created = await request(app)
      .post('/api/v1/automation/rules')
      .set('Authorization', mintBearer())
      .send({
        name: 'Payment reminder rule',
        triggerType: 'EVENT',
        triggerEvent: 'payment.completed',
        actions: [{ type: 'LOG', config: { message: 'paid {{amount}}' } }],
      });
    expect(created.status).toBe(201);
    const eventRuleId = created.body.data.id;

    await eventBus.publish('payment.completed', { tenantId: TEST_COMPANY_ID, amount: '1500' });

    const log = await prisma.jobExecutionLog.findFirst({ where: { tenantId: TEST_COMPANY_ID, ruleId: eventRuleId } });
    expect(log).not.toBeNull();
    expect(log!.status).toBe('SUCCESS');
  });

  it('DELETE /rules/:id → rule मिटता है (अपनी company)', async () => {
    const res = await request(app)
      .delete(`/api/v1/automation/rules/${ruleId}`)
      .set('Authorization', mintBearer());
    expect(res.status).toBe(200);
    const gone = await prisma.automationRule.findFirst({ where: { id: ruleId, tenantId: TEST_COMPANY_ID } });
    expect(gone).toBeNull();
  });
});
