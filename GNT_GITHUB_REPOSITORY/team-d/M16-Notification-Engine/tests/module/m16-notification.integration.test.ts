/**
 * M16 — Notification Engine Integration Tests
 * Exercises the full flow: send -> store -> deliver -> mark read
 * (repository mocked as an in-memory store; channel routing mocked)
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

const store: any[] = [];
const deliveryLogs: any[] = [];

vi.mock('../../backend/src/modules/m16-notification/repositories/notification.repository', () => ({
  notificationRepository: {
    create: vi.fn(async (payload: any) => {
      const record = { id: `n${store.length + 1}`, status: 'pending', ...payload };
      store.push(record);
      return record;
    }),
    createDeliveryLog: vi.fn(async (notificationId: string, channel: string, status: string) => {
      deliveryLogs.push({ notificationId, channel, status });
    }),
    findById: vi.fn(async (id: string) => store.find((n) => n.id === id) ?? null),
    getDeliveryLogs: vi.fn(async (notificationId: string) =>
      deliveryLogs.filter((l) => l.notificationId === notificationId)
    ),
    markAllAsRead: vi.fn(async () => {
      let count = 0;
      store.forEach((n) => {
        if (n.status !== 'read') { n.status = 'read'; count++; }
      });
      return count;
    }),
    markManyAsRead: vi.fn(async (ids: string[]) => {
      let count = 0;
      store.forEach((n) => {
        if (ids.includes(n.id) && n.status !== 'read') { n.status = 'read'; count++; }
      });
      return count;
    }),
    getUnreadCount: vi.fn(async () => store.filter((n) => n.status !== 'read').length),
    findMany: vi.fn(),
    getPendingNotifications: vi.fn(async () => []),
  },
}));

vi.mock('../../backend/src/modules/m16-notification/services/notification.internal', () => ({
  notificationInternal: {
    routeToChannel: vi.fn(async () => undefined),
  },
}));

import { notificationService } from '../../backend/src/modules/m16-notification/services/notification.service';

describe('M16 Notification Engine — Integration', () => {
  beforeEach(() => {
    store.length = 0;
    deliveryLogs.length = 0;
    vi.clearAllMocks();
  });

  it('full flow: send -> track delivery -> mark read -> unread count updates', async () => {
    const { notificationId } = await notificationService.sendNotification({
      userId: 'u1',
      companyId: 'c1',
      title: 'Stock Alert',
      message: 'Product X is running low',
      type: 'in_app',
    } as any);

    expect(notificationId).toBeDefined();

    const tracking = await notificationService.trackDelivery(notificationId);
    expect(tracking.notificationId).toBe(notificationId);

    const before = await notificationService.getUnreadCount('u1', 'c1');
    expect(before.count).toBe(1);

    await notificationService.markAsRead({ markAll: true }, 'u1', 'c1');

    const after = await notificationService.getUnreadCount('u1', 'c1');
    expect(after.count).toBe(0);
  });
});
