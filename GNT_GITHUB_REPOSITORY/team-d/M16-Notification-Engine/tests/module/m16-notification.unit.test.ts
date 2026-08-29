/**
 * M16 — Notification Engine Unit Tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { notificationRepository } from '../../backend/src/modules/m16-notification/repositories/notification.repository';
import { notificationInternal } from '../../backend/src/modules/m16-notification/services/notification.internal';
import { notificationService } from '../../backend/src/modules/m16-notification/services/notification.service';

vi.mock('../../backend/src/modules/m16-notification/repositories/notification.repository', () => ({
  notificationRepository: {
    create: vi.fn(),
    createDeliveryLog: vi.fn(),
    findMany: vi.fn(),
    findById: vi.fn(),
    markAllAsRead: vi.fn(),
    markManyAsRead: vi.fn(),
    getUnreadCount: vi.fn(),
    getDeliveryLogs: vi.fn(),
    getPendingNotifications: vi.fn(),
  },
}));

vi.mock('../../backend/src/modules/m16-notification/services/notification.internal', () => ({
  notificationInternal: {
    routeToChannel: vi.fn(),
  },
}));

describe('M16 Notification Service — Unit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sendNotification creates a notification record and routes to channels', async () => {
    (notificationRepository.create as any).mockResolvedValue({ id: 'n1' });
    (notificationInternal.routeToChannel as any).mockResolvedValue(undefined);

    const result = await notificationService.sendNotification({
      userId: 'u1',
      companyId: 'c1',
      title: 'Invoice Created',
      message: 'Invoice #123 has been created',
      type: 'in_app',
    } as any);

    expect(notificationRepository.create).toHaveBeenCalledTimes(1);
    expect(notificationInternal.routeToChannel).toHaveBeenCalled();
    expect(result.notificationId).toBe('n1');
  });

  it('sendNotification logs a failed delivery if channel routing throws', async () => {
    (notificationRepository.create as any).mockResolvedValue({ id: 'n2' });
    (notificationInternal.routeToChannel as any).mockRejectedValue(new Error('gateway down'));

    await notificationService.sendNotification({
      userId: 'u1',
      companyId: 'c1',
      title: 'Payment Due',
      message: 'Payment reminder',
      type: 'whatsapp',
    } as any);

    expect(notificationRepository.createDeliveryLog).toHaveBeenCalledWith(
      'n2',
      'whatsapp',
      'failed',
      undefined,
      'gateway down'
    );
  });

  it('getUnreadCount returns count from repository', async () => {
    (notificationRepository.getUnreadCount as any).mockResolvedValue(4);
    const result = await notificationService.getUnreadCount('u1', 'c1');
    expect(result.count).toBe(4);
  });
});
