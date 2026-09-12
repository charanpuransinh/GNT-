/**
 * M27 — dashboard/dashboard-builder.ts
 * OWN: Dashboard composition/configuration.
 * Backs table: dashboard (proposed, tenant-owned).
 */

import { DashboardWidget } from './dashboard-widget.service';

export interface Dashboard {
  dashboardId: string;
  tenantId: string;
  ownerId: string;
  name: string;
  widgets: DashboardWidget[];
  createdAt: string;
  updatedAt: string;
}

export interface DashboardRepository {
  save(dashboard: Dashboard): Promise<void>;
  find(dashboardId: string, tenantId: string): Promise<Dashboard | null>;
}

export class DashboardBuilder {
  constructor(private readonly repository: DashboardRepository) {}

  async create(tenantId: string, ownerId: string, name: string): Promise<Dashboard> {
    const now = new Date().toISOString();
    const dashboard: Dashboard = {
      dashboardId: `dash_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      tenantId,
      ownerId,
      name,
      widgets: [],
      createdAt: now,
      updatedAt: now,
    };
    await this.repository.save(dashboard);
    return dashboard;
  }

  async addWidget(dashboardId: string, tenantId: string, widget: DashboardWidget): Promise<Dashboard> {
    const dashboard = await this.repository.find(dashboardId, tenantId);
    if (!dashboard) {
      throw new Error('Dashboard not found for tenant');
    }
    dashboard.widgets.push(widget);
    dashboard.updatedAt = new Date().toISOString();
    await this.repository.save(dashboard);
    return dashboard;
  }

  async removeWidget(dashboardId: string, tenantId: string, widgetId: string): Promise<Dashboard> {
    const dashboard = await this.repository.find(dashboardId, tenantId);
    if (!dashboard) {
      throw new Error('Dashboard not found for tenant');
    }
    dashboard.widgets = dashboard.widgets.filter((w) => w.widgetId !== widgetId);
    dashboard.updatedAt = new Date().toISOString();
    await this.repository.save(dashboard);
    return dashboard;
  }
}

// WIRED (2026-09-12): backed by the new analytics_dashboard table (adapters/real-dashboard-repository.ts).
import { realDashboardRepository } from '../adapters/real-dashboard-repository';
export const dashboardBuilder = new DashboardBuilder(realDashboardRepository);
