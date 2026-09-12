// ============================================================================
// M27 — Analytics, KPI & Dashboard — real DB + real HTTP wiring
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { app, registerModules } from '../../../app';
import { prisma } from '@/common/config/prisma';
import { mintBearer, TEST_COMPANY_ID, TEST_USER_ID } from '@/tests/helpers/auth';

import { metricsService } from '../analytics/metrics.service';
import { analyticsService } from '../analytics/analytics.service';
import { kpiService } from '../reports/kpi.service';
import { dashboardBuilder } from '../dashboard/dashboard-builder';

describe.runIf(process.env.TEST_DB === '1')('M27 — Analytics, KPI & Dashboard (real DB)', () => {
  let invoiceId: string;

  beforeAll(async () => {
    await registerModules();
    invoiceId = randomUUID();
    const customer = await prisma.party_master.findFirst({ where: { company_id: TEST_COMPANY_ID } });
    if (customer) {
      const branch = await prisma.branch_master.findFirst({ where: { company_id: TEST_COMPANY_ID } });
      if (branch) {
        await prisma.salesInvoice.create({
          data: {
            id: invoiceId, companyId: TEST_COMPANY_ID, branchId: branch.id, customerId: customer.id,
            invoiceNumber: `TEST-${invoiceId.slice(0, 8)}`, invoiceDate: new Date(), dueDate: new Date(),
            status: 'draft', totalAmount: 1000, totalTax: 180, totalDiscount: 0, netAmount: 1000,
            roundOff: 0, grandTotal: 1180, paymentStatus: 'unpaid', amountPaid: 0,
          },
        });
      }
    }
  });

  afterAll(async () => {
    await prisma.salesInvoice.deleteMany({ where: { id: invoiceId } }).catch(() => {});
    await prisma.analyticsDashboard.deleteMany({ where: { companyId: TEST_COMPANY_ID } });
  });

  describe('AnalyticsService -> real sales_invoice source', () => {
    it('computes SUM over real grandTotal rows via the wired sales analytics source', async () => {
      metricsService.defineMetric({
        metricKey: 'sales_total', tenantId: TEST_COMPANY_ID, label: 'Sales Total',
        aggregation: 'SUM', sourceEntity: 'sales_invoice', sourceField: 'grandTotal',
      });
      const from = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const to = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
      const result = await analyticsService.computeMetric(TEST_COMPANY_ID, 'sales_total', from, to);
      expect(result).not.toBeNull();
      expect(result!.value).toBeGreaterThanOrEqual(0);
    });

    it('returns null for an undefined metric key', async () => {
      const result = await analyticsService.computeMetric(TEST_COMPANY_ID, 'does_not_exist', '2020-01-01', '2020-01-02');
      expect(result).toBeNull();
    });

    it('returns an empty series (not an error) for an unregistered sourceEntity', async () => {
      metricsService.defineMetric({
        metricKey: 'unregistered_metric', tenantId: TEST_COMPANY_ID, label: 'X',
        aggregation: 'SUM', sourceEntity: 'not_a_real_source',
      });
      const result = await analyticsService.computeMetric(TEST_COMPANY_ID, 'unregistered_metric', '2020-01-01', '2020-01-02');
      expect(result?.value).toBe(0);
    });
  });

  describe('KpiService', () => {
    it('evaluates against the real sales metric and returns a status', async () => {
      const from = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const to = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
      const evaluation = await kpiService.evaluate(
        { kpiId: 'kpi-1', tenantId: TEST_COMPANY_ID, metricKey: 'sales_total', targetValue: 100000, warningThresholdPct: 50 },
        from, to,
      );
      expect(evaluation).not.toBeNull();
      expect(['ON_TRACK', 'WARNING', 'BREACHED']).toContain(evaluation!.status);
    });
  });

  describe('DashboardBuilder -> real analytics_dashboard table', () => {
    it('creates, adds a widget to, and persists a dashboard in real Postgres', async () => {
      const dashboard = await dashboardBuilder.create(TEST_COMPANY_ID, TEST_USER_ID, 'My Dashboard');
      const row = await prisma.analyticsDashboard.findFirst({ where: { id: dashboard.dashboardId } });
      expect(row).not.toBeNull();

      const updated = await dashboardBuilder.addWidget(dashboard.dashboardId, TEST_COMPANY_ID, {
        widgetId: 'w1', tenantId: TEST_COMPANY_ID, dashboardId: dashboard.dashboardId,
        type: 'METRIC_CARD', title: 'Sales', metricKeys: ['sales_total'], position: { x: 0, y: 0, w: 2, h: 2 },
      });
      expect(updated.widgets.length).toBe(1);

      const persisted = await prisma.analyticsDashboard.findFirst({ where: { id: dashboard.dashboardId } });
      expect((persisted!.widgets as any[]).length).toBe(1);
    });

    it('rejects operating on a dashboard from another tenant', async () => {
      const dashboard = await dashboardBuilder.create(TEST_COMPANY_ID, TEST_USER_ID, 'Isolated');
      await expect(
        dashboardBuilder.addWidget(dashboard.dashboardId, 'other-tenant-id', {
          widgetId: 'w2', tenantId: 'other-tenant-id', dashboardId: dashboard.dashboardId,
          type: 'TABLE', title: 'X', metricKeys: [], position: { x: 0, y: 0, w: 1, h: 1 },
        }),
      ).rejects.toThrow();
    });
  });

  describe('HTTP — /api/v1/analytics (real permission middleware)', () => {
    it('GET /metrics 200s for an authenticated Owner', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/metrics?keys=sales_total&from=2020-01-01&to=2030-01-01')
        .set('Authorization', mintBearer(TEST_COMPANY_ID, TEST_USER_ID));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('GET /metrics 401s without a token', async () => {
      const res = await request(app).get('/api/v1/analytics/metrics?keys=sales_total');
      expect(res.status).toBe(401);
    });
  });
});
