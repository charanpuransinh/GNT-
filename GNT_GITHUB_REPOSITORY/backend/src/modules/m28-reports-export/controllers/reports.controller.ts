/**
 * M28 — controllers/reports.controller.ts
 * OWN: Reports & Export HTTP API — build a report from real M27 metrics,
 * export it (CSV today; PDF/XLSX require an owner dependency decision, see
 * report-export.service.ts). Framework-agnostic, standard success/failure
 * envelope (same shape as M23/M24/M26/M27 controllers).
 *
 * Scheduling (ExportScheduler) is intentionally NOT exposed here — it has
 * no real SchedulerPort wired (M13's job-creation methods aren't public,
 * and M13's scheduled_job model requires a ruleId tied to an automation
 * rule; forcing M28's report schedules through that would mean inventing
 * a matching AutomationRule per report, guessing M13's execution
 * semantics). Left for an explicit owner decision — see CERTIFICATION_LOG.
 */

import { ReportBuilder, reportBuilder, type ReportSpec, type BuiltReport } from '../reports/report-builder';
import { ReportExportService, reportExportService, type ExportFormat } from '../reports/report-export.service';

export interface ReportsAuthContext {
  userId: string;
  tenantId: string;
  permissions: string[];
}

export interface ApiSuccess<T> { success: true; data: T; meta: { correlationId: string } }
export interface ApiFailure { success: false; error: { code: string; message: string }; meta: { correlationId: string } }
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export class ReportsPermissionDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReportsPermissionDeniedError';
  }
}

export class ReportsController {
  constructor(
    private readonly builder: ReportBuilder = reportBuilder,
    private readonly exporter: ReportExportService = reportExportService,
  ) {}

  async buildReport(
    auth: ReportsAuthContext,
    input: { reportId: string; sourceMetricKeys: string[]; columns: string[]; fromDate: string; toDate: string },
    correlationId: string,
  ): Promise<ApiResponse<BuiltReport>> {
    try {
      this.requirePermission(auth, 'M28:view');
      const spec: ReportSpec = {
        reportId: input.reportId,
        tenantId: auth.tenantId,
        sourceMetricKeys: input.sourceMetricKeys ?? [],
        columns: input.columns ?? [],
      };
      const data = await this.builder.build(spec, input.fromDate, input.toDate);
      return { success: true, data, meta: { correlationId } };
    } catch (err) {
      return this.toFailure(err, correlationId);
    }
  }

  async exportReport(
    auth: ReportsAuthContext,
    input: { reportId: string; sourceMetricKeys: string[]; columns: string[]; fromDate: string; toDate: string; format: ExportFormat },
    correlationId: string,
  ): Promise<ApiResponse<{ format: ExportFormat; filename: string; contentBase64: string }>> {
    try {
      this.requirePermission(auth, 'M28:view');
      const spec: ReportSpec = {
        reportId: input.reportId,
        tenantId: auth.tenantId,
        sourceMetricKeys: input.sourceMetricKeys ?? [],
        columns: input.columns ?? [],
      };
      const report = await this.builder.build(spec, input.fromDate, input.toDate);
      const exported = await this.exporter.export(report, input.format ?? 'CSV');
      return {
        success: true,
        data: { format: exported.format, filename: exported.filename, contentBase64: exported.content.toString('base64') },
        meta: { correlationId },
      };
    } catch (err) {
      return this.toFailure(err, correlationId);
    }
  }

  private requirePermission(auth: ReportsAuthContext, permission: string): void {
    if (!auth.permissions.includes(permission)) {
      throw new ReportsPermissionDeniedError(`Missing permission ${permission}`);
    }
  }

  private toFailure(err: unknown, correlationId: string): ApiFailure {
    const code = err instanceof ReportsPermissionDeniedError ? 'REPORTS_ACCESS_DENIED' : 'REPORTS_ERROR';
    const message = err instanceof Error ? err.message : 'Unexpected reports error';
    return { success: false, error: { code, message }, meta: { correlationId } };
  }
}

export const reportsController = new ReportsController();
