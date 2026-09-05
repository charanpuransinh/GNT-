// ============================================================================
// M16 — Notification service (DB-gated): send → list → unread → mark-read
// (campaign + order-link पहले से campaign.db.test.ts / order-link.test.ts में)
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/common/config/prisma';
import { notificationService } from '../../services/notification.service';
import { TEST_USER_ID } from '@/tests/helpers/auth';

const COMPANY_ID = '00000000-0000-4000-8000-000000000030';

async function cleanup() {
  await prisma.notificationDeliveryLog.deleteMany({ where: { notification: { companyId: COMPANY_ID } } });
  await prisma.notificationMaster.deleteMany({ where: { companyId: COMPANY_ID } });
}

describe.runIf(process.env.TEST_DB === '1')('M16 notification service — live DB', () => {
  beforeAll(async () => {
    await prisma.company_master.upsert({
      where: { id: COMPANY_ID },
      update: { name: 'Notif Co' },
      create: { id: COMPANY_ID, name: 'Notif Co', code: 'NOTCO' },
    });
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
  });

  it('send (in_app) → list → unread-count → mark-read', async () => {
    const sent = await notificationService.sendNotification({
      userId: TEST_USER_ID,
      companyId: COMPANY_ID,
      title: 'Test title',
      message: 'Test message',
      type: 'in_app',
      entityType: 'automation',
      channels: ['in_app'],
    });
    expect(sent.notificationId).toBeTruthy();

    const list = await notificationService.getNotifications({
      companyId: COMPANY_ID,
      userId: TEST_USER_ID,
    });
    expect(list.data.some((n: { id: string }) => n.id === sent.notificationId)).toBe(true);

    const unread = await notificationService.getUnreadCount(TEST_USER_ID, COMPANY_ID);
    expect(unread.count).toBeGreaterThanOrEqual(1);

    await notificationService.markAsRead(
      { notificationIds: [sent.notificationId] },
      TEST_USER_ID,
      COMPANY_ID,
    );

    const unreadAfter = await notificationService.getUnreadCount(TEST_USER_ID, COMPANY_ID);
    expect(unreadAfter.count).toBeLessThan(unread.count);
  });

  it('companyId fail-closed — बिना companyId list नहीं चलती', async () => {
    await expect(
      notificationService.getNotifications({ userId: TEST_USER_ID }),
    ).rejects.toThrow();
  });
});
