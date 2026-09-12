/**
 * M27 — adapters/real-dashboard-repository.ts
 * WIRED (2026-09-12): DashboardRepository backed by the new
 * `analytics_dashboard` table (migration 022) — genuinely new, no overlap
 * with any existing table. Widgets stored as JSON (they're plain config,
 * not something another module queries relationally).
 */

import { prisma } from '@/common/config/prisma';
import { Prisma } from '@prisma/client';
import type { Dashboard, DashboardRepository } from '../dashboard/dashboard-builder';

export class RealDashboardRepository implements DashboardRepository {
  async save(dashboard: Dashboard): Promise<void> {
    await prisma.analyticsDashboard.upsert({
      where: { id: dashboard.dashboardId },
      update: {
        name: dashboard.name,
        widgets: dashboard.widgets as unknown as Prisma.InputJsonValue,
      },
      create: {
        id: dashboard.dashboardId,
        companyId: dashboard.tenantId,
        ownerId: dashboard.ownerId,
        name: dashboard.name,
        widgets: dashboard.widgets as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async find(dashboardId: string, tenantId: string): Promise<Dashboard | null> {
    const row = await prisma.analyticsDashboard.findFirst({ where: { id: dashboardId, companyId: tenantId } });
    if (!row) return null;
    return {
      dashboardId: row.id,
      tenantId: row.companyId,
      ownerId: row.ownerId,
      name: row.name,
      widgets: row.widgets as unknown as Dashboard['widgets'],
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}

export const realDashboardRepository = new RealDashboardRepository();
