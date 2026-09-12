/**
 * M28 — reports/report-builder.ts
 * OWN: Build reports from approved data sources.
 *
 * WIRED (2026-09-12): `ReportDataProvider` is backed by the real M27
 * `analyticsService` (adapters/real-report-data-provider.ts) — M27 is
 * wired and confirmed.
 *
 * M28's original `ReportTemplateService`/`ReportTemplate` (persisted
 * report templates) was dropped entirely — it duplicates M17's real,
 * existing `ReportTemplate` Prisma model (@@map("report_template")),
 * same table name and overlapping purpose. `ReportSpec` below is a plain
 * inline definition (metric keys + columns), not a persisted template —
 * a UI wanting saved templates should use M17's real ReportTemplate.
 */

export interface ReportSpec {
  reportId: string;
  tenantId: string;
  sourceMetricKeys: string[];
  columns: string[];
}

export interface ReportDataProvider {
  fetchRows(tenantId: string, sourceMetricKeys: string[], fromDate: string, toDate: string): Promise<Record<string, unknown>[]>;
}

export interface BuiltReport {
  templateId: string;
  tenantId: string;
  columns: string[];
  rows: Record<string, unknown>[];
  generatedAt: string;
}

export class ReportBuilder {
  constructor(private readonly dataProvider: ReportDataProvider) {}

  async build(spec: ReportSpec, fromDate: string, toDate: string): Promise<BuiltReport> {
    const rows = await this.dataProvider.fetchRows(spec.tenantId, spec.sourceMetricKeys, fromDate, toDate);
    return {
      templateId: spec.reportId,
      tenantId: spec.tenantId,
      columns: spec.columns,
      rows,
      generatedAt: new Date().toISOString(),
    };
  }
}

import { realReportDataProvider } from '../adapters/real-report-data-provider';
export const reportBuilder = new ReportBuilder(realReportDataProvider);
