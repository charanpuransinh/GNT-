/**
 * M27 — dashboard/analytics.controller.ts
 * OWN: Analytics/dashboard API.
 * Framework-agnostic, standard success/failure envelope (Section 20).
 *
 * WIRED (2026-09-12): fictional 'M27.ANALYTICS.READ'/'M27.KPI.READ'/
 * 'M27.DASHBOARD.READ' strings replaced with the real permission format
 * ("M<code>:<action>"). All three are read operations, so all map to
 * 'M27:view' — the real system has no per-feature permission granularity.
 */

import { AnalyticsService, analyticsService } from '../analytics/analytics.service';
import { KpiService, kpiService, KpiDefinition } from '../reports/kpi.service';
import { DashboardWidgetService, dashboardWidgetService, DashboardWidget } from './dashboard-widget.service';

export interface AnalyticsAuthContext {
  userId: string;
  tenantId: string;
  permissions: string[];
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta: { correlationId: string };
}
export interface ApiFailure {
  success: false;
  error: { code: string; message: string };
  meta: { correlationId: string };
}
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export class AnalyticsPermissionDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AnalyticsPermissionDeniedError';
  }
}

export class AnalyticsController {
  constructor(
    private readonly analytics: AnalyticsService = analyticsService,
    private readonly kpi: KpiService = kpiService,
    private readonly widgetService: DashboardWidgetService = dashboardWidgetService,
  ) {}

  async getMetrics(
    auth: AnalyticsAuthContext,
    metricKeys: string[],
    fromDate: string,
    toDate: string,
    correlationId: string,
  ): Promise<ApiResponse<Awaited<ReturnType<AnalyticsService['computeMany']>>>> {
    try {
      this.requirePermission(auth, 'M27:view');
      const data = await this.analytics.computeMany(auth.tenantId, metricKeys, fromDate, toDate);
      return { success: true, data, meta: { correlationId } };
    } catch (err) {
      return this.toFailure(err, correlationId);
    }
  }

  async evaluateKpi(
    auth: AnalyticsAuthContext,
    definition: KpiDefinition,
    fromDate: string,
    toDate: string,
    correlationId: string,
  ): Promise<ApiResponse<Awaited<ReturnType<KpiService['evaluate']>>>> {
    try {
      this.requirePermission(auth, 'M27:view');
      if (definition.tenantId !== auth.tenantId) {
        throw new AnalyticsPermissionDeniedError('Cross-tenant KPI evaluation denied');
      }
      const data = await this.kpi.evaluate(definition, fromDate, toDate);
      return { success: true, data, meta: { correlationId } };
    } catch (err) {
      return this.toFailure(err, correlationId);
    }
  }

  async getWidgetData(
    auth: AnalyticsAuthContext,
    widget: DashboardWidget,
    fromDate: string,
    toDate: string,
    correlationId: string,
  ): Promise<ApiResponse<Awaited<ReturnType<DashboardWidgetService['loadData']>>>> {
    try {
      this.requirePermission(auth, 'M27:view');
      if (widget.tenantId !== auth.tenantId) {
        throw new AnalyticsPermissionDeniedError('Cross-tenant widget access denied');
      }
      const data = await this.widgetService.loadData(widget, fromDate, toDate);
      return { success: true, data, meta: { correlationId } };
    } catch (err) {
      return this.toFailure(err, correlationId);
    }
  }

  private requirePermission(auth: AnalyticsAuthContext, permission: string): void {
    if (!auth.permissions.includes(permission)) {
      throw new AnalyticsPermissionDeniedError(`Missing permission ${permission}`);
    }
  }

  private toFailure(err: unknown, correlationId: string): ApiFailure {
    const code = err instanceof AnalyticsPermissionDeniedError ? 'ANALYTICS_ACCESS_DENIED' : 'ANALYTICS_ERROR';
    const message = err instanceof Error ? err.message : 'Unexpected analytics error';
    return { success: false, error: { code, message }, meta: { correlationId } };
  }
}

export const analyticsController = new AnalyticsController();
