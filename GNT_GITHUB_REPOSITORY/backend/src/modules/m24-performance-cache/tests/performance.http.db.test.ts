// ============================================================================
// M24 — Performance, Cache & Database Optimization — real DB + real HTTP wiring
//
// Mounted 2026-09-13 at /api/v1/performance (module-registry.ts). Verifies
// the module is actually reachable (audit finding: real+tested but never
// mounted) and that performance snapshots are tenant-scoped, not leaking
// another tenant's recorded operations.
// ============================================================================

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app, registerModules } from '../../../app';
import { mintBearer, TEST_COMPANY_ID, TEST_USER_ID } from '@/tests/helpers/auth';
import { performanceMonitorService } from '../monitoring/performance-monitor.service';

const OTHER_COMPANY_ID = '00000000-0000-4000-8000-000000000097';

describe.runIf(process.env.TEST_DB === '1')('M24 — Performance & Cache (real DB, real HTTP)', () => {
  beforeAll(async () => {
    await registerModules();
    performanceMonitorService.record({ operationName: 'm24-test-op', tenantId: TEST_COMPANY_ID, durationMs: 42, success: true });
    performanceMonitorService.record({ operationName: 'm24-test-op', tenantId: OTHER_COMPANY_ID, durationMs: 9999, success: false });
  });

  it('GET /snapshot 401s without a token (module is actually mounted, not a stray 404)', async () => {
    const res = await request(app).get('/api/v1/performance/snapshot?operation=m24-test-op');
    expect(res.status).toBe(401);
  });

  it('GET /snapshot returns only this tenant\'s own recorded operations', async () => {
    const res = await request(app)
      .get('/api/v1/performance/snapshot?operation=m24-test-op')
      .set('Authorization', mintBearer(TEST_COMPANY_ID, TEST_USER_ID));
    expect(res.status).toBe(200);
    expect(res.body.data.requestCount).toBe(1);
    expect(res.body.data.avgDurationMs).toBe(42);
  });

  it('cross-tenant: the other tenant\'s slow/failed sample never leaks into this tenant\'s snapshot', async () => {
    const res = await request(app)
      .get('/api/v1/performance/snapshot?operation=m24-test-op')
      .set('Authorization', mintBearer(TEST_COMPANY_ID, TEST_USER_ID));
    expect(res.body.data.failureCount).toBe(0);
    expect(res.body.data.avgDurationMs).toBeLessThan(9999);
  });

  it('GET /index lists real pg_indexes rows for an existing table', async () => {
    const res = await request(app)
      .get('/api/v1/performance/index?table=party_master')
      .set('Authorization', mintBearer(TEST_COMPANY_ID, TEST_USER_ID));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('POST /index/propose rejects an index that already exists rather than proposing a duplicate', async () => {
    const list = await request(app)
      .get('/api/v1/performance/index?table=party_master')
      .set('Authorization', mintBearer(TEST_COMPANY_ID, TEST_USER_ID));
    const existing = list.body.data[0];
    const res = await request(app)
      .post('/api/v1/performance/index/propose')
      .set('Authorization', mintBearer(TEST_COMPANY_ID, TEST_USER_ID))
      .send({ table: 'party_master', columns: existing.columns });
    expect(res.status).toBe(500);
    expect(res.body.error.message).toContain('already exists');
  });

  it('GET /query/recommendations runs without error (real analyzer, may legitimately be empty)', async () => {
    const res = await request(app)
      .get('/api/v1/performance/query/recommendations')
      .set('Authorization', mintBearer(TEST_COMPANY_ID, TEST_USER_ID));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
