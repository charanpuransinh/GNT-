// ============================================================================
// M23 — Security, Governance & Data Protection — real DB + real HTTP wiring
//
// Mounted 2026-09-12/13 at /api/v1/security (module-registry.ts). Verifies
// the module is actually reachable (not just unit-tested in isolation, per
// the audit finding that M23/M24/M25/M28-M31 were real+tested but never
// mounted), and that tenant isolation actually holds at the HTTP layer.
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, registerModules } from '../../../app';
import { prisma } from '@/common/config/prisma';
import { mintBearer, TEST_COMPANY_ID, TEST_USER_ID } from '@/tests/helpers/auth';

const OTHER_COMPANY_ID = '00000000-0000-4000-8000-000000000098';

async function cleanup() {
  await prisma.securityPolicy.deleteMany({ where: { companyId: { in: [TEST_COMPANY_ID, OTHER_COMPANY_ID] }, name: { startsWith: 'M23-TEST-' } } });
  await prisma.dataRetentionPolicy.deleteMany({ where: { companyId: { in: [TEST_COMPANY_ID, OTHER_COMPANY_ID] }, entityType: { startsWith: 'm23_test_' } } });
}

describe.runIf(process.env.TEST_DB === '1')('M23 — Security & Governance (real DB, real HTTP)', () => {
  beforeAll(async () => {
    await registerModules();
    await prisma.company_master.upsert({
      where: { id: OTHER_COMPANY_ID },
      update: {},
      create: { id: OTHER_COMPANY_ID, name: 'M23 Other Co', code: 'M23OTHER' },
    });
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
  });

  it('GET /policy 401s without a token (module is actually mounted, not a stray 404)', async () => {
    const res = await request(app).get('/api/v1/security/policy');
    expect(res.status).toBe(401);
  });

  it('POST /policy creates a real security_policy row scoped to the caller tenant', async () => {
    const res = await request(app)
      .post('/api/v1/security/policy')
      .set('Authorization', mintBearer(TEST_COMPANY_ID, TEST_USER_ID))
      .send({ name: 'M23-TEST-deny-export', resource: 'report', action: 'export', effect: 'DENY' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tenantId).toBe(TEST_COMPANY_ID);

    const row = await prisma.securityPolicy.findFirst({ where: { companyId: TEST_COMPANY_ID, name: 'M23-TEST-deny-export' } });
    expect(row).not.toBeNull();
  });

  it('POST /policy/evaluate returns DENY for the just-created explicit DENY policy', async () => {
    const res = await request(app)
      .post('/api/v1/security/policy/evaluate')
      .set('Authorization', mintBearer(TEST_COMPANY_ID, TEST_USER_ID))
      .send({ resource: 'report', action: 'export' });
    expect(res.status).toBe(200);
    expect(res.body.data.effect).toBe('DENY');
    expect(res.body.data.matchedPolicyId).not.toBeNull();
  });

  it('default-deny: an unconfigured resource/action evaluates to DENY, not a fabricated ALLOW', async () => {
    const res = await request(app)
      .post('/api/v1/security/policy/evaluate')
      .set('Authorization', mintBearer(TEST_COMPANY_ID, TEST_USER_ID))
      .send({ resource: 'never_configured_resource', action: 'never_configured_action' });
    expect(res.status).toBe(200);
    expect(res.body.data.effect).toBe('DENY');
    expect(res.body.data.matchedPolicyId).toBeNull();
  });

  it('tenant isolation: a policy created under one tenant is invisible when listing as another tenant', async () => {
    const otherList = await request(app)
      .get('/api/v1/security/policy')
      .set('Authorization', mintBearer(OTHER_COMPANY_ID, TEST_USER_ID));
    expect(otherList.status).toBe(200);
    expect(otherList.body.data.some((p: { name: string }) => p.name === 'M23-TEST-deny-export')).toBe(false);

    const ownList = await request(app)
      .get('/api/v1/security/policy')
      .set('Authorization', mintBearer(TEST_COMPANY_ID, TEST_USER_ID));
    expect(ownList.body.data.some((p: { name: string }) => p.name === 'M23-TEST-deny-export')).toBe(true);
  });

  it('POST /retention creates a real data_retention_policy row; POST /retention/execute runs without a registered executor (skips, does not fabricate a purge)', async () => {
    const create = await request(app)
      .post('/api/v1/security/retention')
      .set('Authorization', mintBearer(TEST_COMPANY_ID, TEST_USER_ID))
      .send({ entityType: 'm23_test_entity', retentionDays: 30 });
    expect(create.status).toBe(201);

    const exec = await request(app)
      .post('/api/v1/security/retention/execute')
      .set('Authorization', mintBearer(TEST_COMPANY_ID, TEST_USER_ID));
    expect(exec.status).toBe(200);
    // no RetentionExecutor is registered for 'm23_test_entity' anywhere in the app —
    // the service must skip it silently, never invent a purge count.
    expect(exec.body.data.find((r: { entityType: string }) => r.entityType === 'm23_test_entity')).toBeUndefined();
  });

  it('rejects an invalid retentionDays rather than silently accepting garbage', async () => {
    const res = await request(app)
      .post('/api/v1/security/retention')
      .set('Authorization', mintBearer(TEST_COMPANY_ID, TEST_USER_ID))
      .send({ entityType: 'm23_test_bad', retentionDays: -5 });
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);

    const row = await prisma.dataRetentionPolicy.findFirst({ where: { companyId: TEST_COMPANY_ID, entityType: 'm23_test_bad' } });
    expect(row).toBeNull();
  });
});
