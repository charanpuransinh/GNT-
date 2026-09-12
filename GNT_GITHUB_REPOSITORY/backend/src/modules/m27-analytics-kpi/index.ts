/**
 * M27 — Analytics, KPI & Dashboard Intelligence
 * index.ts — Public M27 exports.
 * PROVIDE (per blueprint): KPI API, dashboard API, analytics API.
 */

export { MetricsService, metricsService, type MetricDefinition, type MetricDataPoint, type AggregationType } from './analytics/metrics.service';
export { AnalyticsQueryService, analyticsQueryService, type AnalyticsDataSource } from './analytics/analytics-query.service';
export { AnalyticsService, analyticsService, type AnalyticsResult } from './analytics/analytics.service';

export { KpiService, kpiService, type KpiDefinition, type KpiEvaluation } from './reports/kpi.service';

export { DashboardBuilder, dashboardBuilder, type Dashboard, type DashboardRepository } from './dashboard/dashboard-builder';
export { DashboardWidgetService, dashboardWidgetService, type DashboardWidget, type WidgetData, type WidgetType } from './dashboard/dashboard-widget.service';
export {
  AnalyticsController,
  analyticsController,
  AnalyticsPermissionDeniedError,
  type AnalyticsAuthContext,
  type ApiResponse,
} from './dashboard/analytics.controller';

export { analyticsRoutes } from './routes/analytics.routes';
