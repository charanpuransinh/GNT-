// ============================================================================
// M28 — Reports & Export — wiring tests
//
// ReportBuilder is DB-gated (its data provider calls the real, wired M27
// analyticsService, which reads real Postgres). ReportExportService's CSV
// renderer and ExportScheduler's plumbing are pure logic, no DB needed.
// ============================================================================

import { describe, it, expect } from 'vitest';
import { reportExportService } from '../reports/report-export.service';
import type { BuiltReport } from '../reports/report-builder';
import { ExportScheduler, type SchedulerPort } from '../scheduler/export-scheduler';
import { metricsService } from '@/modules/m27-analytics-kpi';
import { reportBuilder } from '../reports/report-builder';
import { TEST_COMPANY_ID } from '@/tests/helpers/auth';

describe('M28 — ReportExportService (real, dependency-free CSV renderer)', () => {
  it('renders CSV with header + escaped fields', async () => {
    const report: BuiltReport = {
      templateId: 'r1', tenantId: 't1', columns: ['name', 'note'],
      rows: [{ name: 'Acme, Inc.', note: 'has "quotes"' }],
      generatedAt: new Date().toISOString(),
    };
    const file = await reportExportService.export(report, 'CSV');
    const text = file.content.toString('utf-8');
    expect(text).toContain('name,note');
    expect(text).toContain('"Acme, Inc."');
    expect(text).toContain('"has ""quotes"""');
  });

  it('throws for an unregistered format (PDF/XLSX not wired — no library exists)', async () => {
    const report: BuiltReport = { templateId: 'r1', tenantId: 't1', columns: [], rows: [], generatedAt: new Date().toISOString() };
    await expect(reportExportService.export(report, 'PDF')).rejects.toThrow();
  });
});

describe('M28 — ExportScheduler (pure logic, mock SchedulerPort — real M13 wiring is blocked, see notes)', () => {
  it('builds a stable job key and delegates to the injected SchedulerPort', async () => {
    const calls: unknown[] = [];
    const mockPort: SchedulerPort = {
      registerJob: async (jobKey, cron, payload) => { calls.push({ jobKey, cron, payload }); return { jobId: 'job-1' }; },
      cancelJob: async () => {},
    };
    const scheduler = new ExportScheduler(mockPort);
    const result = await scheduler.schedule({
      tenantId: 't1', templateId: 'tpl1', cronExpression: '0 6 * * *', format: 'CSV', recipients: ['a@b.com'],
    });
    expect(result.jobId).toBe('job-1');
    expect((calls[0] as any).jobKey).toBe('m28-report-export:t1:tpl1');
  });

  it('unschedule delegates to cancelJob', async () => {
    let cancelled: string | null = null;
    const mockPort: SchedulerPort = {
      registerJob: async () => ({ jobId: 'x' }),
      cancelJob: async (jobId) => { cancelled = jobId; },
    };
    const scheduler = new ExportScheduler(mockPort);
    await scheduler.unschedule('job-42');
    expect(cancelled).toBe('job-42');
  });
});

describe.runIf(process.env.TEST_DB === '1')('M28 — ReportBuilder -> real M27 analyticsService', () => {
  it('builds a report row from a real M27 metric', async () => {
    metricsService.defineMetric({
      metricKey: 'm28_test_metric', tenantId: TEST_COMPANY_ID, label: 'X',
      aggregation: 'COUNT', sourceEntity: 'sales_invoice',
    });
    const report = await reportBuilder.build(
      { reportId: 'rep1', tenantId: TEST_COMPANY_ID, sourceMetricKeys: ['m28_test_metric'], columns: ['m28_test_metric'] },
      '2020-01-01', '2030-01-01',
    );
    expect(report.rows.length).toBe(1);
    expect(typeof report.rows[0].m28_test_metric).toBe('number');
  });
});
