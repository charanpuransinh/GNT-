/**
 * GNT M16 — Notification Engine Prisma Model Extensions
 * Extended Prisma client for notification_master & notification_delivery_log
 */

import { Prisma } from '@prisma/client';

export const notificationMasterExtension = Prisma.defineExtension({
  model: {
    notificationMaster: {
      async findByUser(userId: string, companyId: string, options?: { page?: number; limit?: number }) {
        const page = options?.page ?? 1;
        const limit = options?.limit ?? 20;
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
          Prisma.getExtensionContext(this).notificationMaster.findMany({
            where: { userId, companyId },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          }),
          Prisma.getExtensionContext(this).notificationMaster.count({
            where: { userId, companyId },
          }),
        ]);

        return { data, total, page, limit };
      },

      async markAsRead(notificationId: string) {
        return Prisma.getExtensionContext(this).notificationMaster.update({
          where: { id: notificationId },
          data: { status: 'read', readAt: new Date() },
        });
      },

      async getUnreadCount(userId: string, companyId: string) {
        return Prisma.getExtensionContext(this).notificationMaster.count({
          where: {
            userId,
            companyId,
            status: { not: 'read' },
          },
        });
      },

      async findPendingNotifications() {
        return Prisma.getExtensionContext(this).notificationMaster.findMany({
          where: { status: 'pending' },
          include: { deliveryLogs: true },
          orderBy: { priority: 'desc' },
        });
      },
    },
  },
});

export const notificationDeliveryLogExtension = Prisma.defineExtension({
  model: {
    notificationDeliveryLog: {
      async createLog(notificationId: string, channel: string, status: string, providerResponse?: string, errorMessage?: string) {
        return Prisma.getExtensionContext(this).notificationDeliveryLog.create({
          data: {
            notificationId,
            channel,
            status,
            providerResponse,
            errorMessage,
            attemptedAt: new Date(),
          },
        });
      },

      async getDeliveryHistory(notificationId: string) {
        return Prisma.getExtensionContext(this).notificationDeliveryLog.findMany({
          where: { notificationId },
          orderBy: { attemptedAt: 'desc' },
        });
      },
    },
  },
});
