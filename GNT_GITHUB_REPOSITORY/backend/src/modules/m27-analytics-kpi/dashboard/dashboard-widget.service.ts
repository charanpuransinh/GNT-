/**
 * M27 — dashboard/dashboard-widget.service.ts
 * OWN: Widget lifecycle/data.
 * Backs table: dashboard_widget (proposed, tenant-owned).
 */

import { AnalyticsService, analyticsService } from '../analytics/analytics.service';

export type WidgetType = 'METRIC_CARD' | 'LINE_CHART' | 'BAR_CHART' | 'TABLE' | 'KPI_GAUGE';

export interface DashboardWidget {
  widgetId: string;
  tenantId: string;
  dashboardId: string;
  type: WidgetType;
  title: string;
  metricKeys: string[];
  position: { x: number; y: number; w: number; h: number };
}

export interface WidgetData {
  widgetId: string;
  values: Record<string, number>;
  generatedAt: string;
}

export class DashboardWidgetService {
  constructor(private readonly analytics: AnalyticsService = analyticsService) {}

  async loadData(widget: DashboardWidget, fromDate: string, toDate: string): Promise<WidgetData> {
    const results = await this.analytics.computeMany(widget.tenantId, widget.metricKeys, fromDate, toDate);
    const values: Record<string, number> = {};
    for (const r of results) values[r.metricKey] = r.value;

    return { widgetId: widget.widgetId, values, generatedAt: new Date().toISOString() };
  }
}

export const dashboardWidgetService = new DashboardWidgetService();
