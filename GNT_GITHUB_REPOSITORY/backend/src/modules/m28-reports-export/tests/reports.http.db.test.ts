// ============================================================================
// M28 — Reports & Export — real DB + real HTTP wiring
//
// Mounted 2026-09-13 at /api/v1/reports-export (module-registry.ts, NOT
// /api/v1/reports which M17 owns). Verifies the module is reachable and
// that the build/export path correctly composes on top of the real M27
// metrics engine.
// ============================================================================

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app, registerModules } from '../../../app';
import { mintBearer, TEST_COMPANY_ID, TEST_USER_ID } from '@/tests/helpers/auth';
import { metricsService } from '@/modules/m27-analytics-kpi';

describe.runIf(process.env.TEST_DB === '1')('M28 — Reports & Export (real DB, real HTTP)', () => {
  beforeAll(async () => {
    await registerModules();
    metricsService.defineMetric({
      metricKey: 'm28_test_metric', tenantId: TEST_COMPANY_ID, label: 'M28 Test',
      aggregation: 'SUM', sourceEntity: 'sales_invoice', sourceField: 'grandTotal',
    });
  });

  it('POST /build 401s without a token (module is actually mounted, not a stray 404)', async () => {
    const res = await request(app).post('/api/v1/reports-export/build').send({});
    expect(res.status).toBe(401);
  });

  it('POST /build composes a real report from the real M27 metrics engine, forcing tenantId from auth (never the body)', async () => {
    const res = await request(app)
      .post('/api/v1/reports-export/build')
      .set('Authorization', mintBearer(TEST_COMPANY_ID, TEST_USER_ID))
      .send({
        reportId: 'm28-test-report',
        sourceMetricKeys: ['m28_test_metric'],
        columns: ['value'],
        fromDate: '2020-01-01',
        toDate: '2030-01-01',
        tenantId: 'some-other-tenant-should-be-ignored',
      });
    expect(res.status).toBe(200);
    expect(res.body.data.tenantId).toBe(TEST_COMPANY_ID);
    expect(Array.isArray(res.body.data.rows)).toBe(true);
  });

  it('POST /export returns a real CSV file (base64) built from the same pipeline', async () => {
    const res = await request(app)
      .post('/api/v1/reports-export/export')
      .set('Authorization', mintBearer(TEST_COMPANY_ID, TEST_USER_ID))
      .send({
        reportId: 'm28-test-report',
        sourceMetricKeys: ['m28_test_metric'],
        columns: ['value'],
        fromDate: '2020-01-01',
        toDate: '2030-01-01',
        format: 'CSV',
      });
    expect(res.status).toBe(200);
    expect(res.body.data.format).toBe('CSV');
    expect(res.body.data.filename).toContain('m28-test-report');
    const decoded = Buffer.from(res.body.data.contentBase64, 'base64').toString('utf-8');
    expect(decoded).toContain('value');
  });

  it('POST /export rejects an unregistered format (PDF/XLSX) rather than fabricating a renderer', async () => {
    const res = await request(app)
      .post('/api/v1/reports-export/export')
      .set('Authorization', mintBearer(TEST_COMPANY_ID, TEST_USER_ID))
      .send({
        reportId: 'm28-test-report',
        sourceMetricKeys: ['m28_test_metric'],
        columns: ['value'],
        fromDate: '2020-01-01',
        toDate: '2030-01-01',
        format: 'PDF',
      });
    expect(res.status).toBe(500);
    expect(res.body.error.message).toContain('No renderer registered');
  });
});
