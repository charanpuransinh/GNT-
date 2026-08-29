/**
 * M16 — Notification Engine Load / Performance Tests
 * Validates the module stays responsive under bulk-send conditions
 * (repository/channel-routing mocked — this tests service-layer throughput,
 * not real DB or gateway latency)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../backend/src/modules/m16-notification/repositories/notification.repository', () => ({
  notificationRepository: {
    create: vi.fn(async (payload: any) => ({ id: `n-${Math.random()}`, status: 'pending', ...payload })),
    createDeliveryLog: vi.fn(async () => undefined),
    getPendingNotifications: vi.fn(async () => []),
    findMany: vi.fn(),
    findById: vi.fn(),
    getDeliveryLogs: vi.fn(),
    markAllAsRead: vi.fn(),
    markManyAsRead: vi.fn(),
    getUnreadCount: vi.fn(async () => 0),
  },
}));

vi.mock('../../backend/src/modules/m16-notification/services/notification.internal', () => ({
  notificationInternal: {
    routeToChannel: vi.fn(async () => undefined),
  },
}));

import { notificationService } from '../../backend/src/modules/m16-notification/services/notification.service';

describe('M16 Notification — Load Test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('processes 500 concurrent sendNotification calls within an acceptable time budget', async () => {
    const BATCH = 500;
    const start = Date.now();

    const calls = Array.from({ length: BATCH }, (_, i) =>
      notificationService.sendNotification({
        userId: `u${i}`,
        companyId: 'c1',
        title: 'Bulk Test',
        message: `Notification ${i}`,
        type: 'in_app',
      } as any)
    );

    const results = await Promise.all(calls);
    const durationMs = Date.now() - start;

    expect(results).toHaveLength(BATCH);
    results.forEach((r) => expect(r.notificationId).toBeDefined());

    // Budget: 500 mocked sends should comfortably complete under 3s in CI
    expect(durationMs).toBeLessThan(3000);
  });
});
