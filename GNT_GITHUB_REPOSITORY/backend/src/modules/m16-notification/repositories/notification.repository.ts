/**
 * GNT M16 — Notification Repository
 * OWNER ONLY — Direct database access for notification_master & delivery_log
 * 
 * RULE: No external module may import this directly.
 *       Use notification.service.ts (PUBLIC) instead.
 */

import { PrismaClient } from '@prisma/client';
import {
  NotificationMaster,
  NotificationDeliveryLog,
  NotificationFilter,
  SendNotificationPayload,
  NotificationListResponse,
} from '../types/notification.types';

const prisma = new PrismaClient();

export class NotificationRepository {
  private static instance: NotificationRepository;

  private constructor() {}

  static getInstance(): NotificationRepository {
    if (!NotificationRepository.instance) {
      NotificationRepository.instance = new NotificationRepository();
    }
    return NotificationRepository.instance;
  }

  /**
   * Create a new notification record
   */
  async create(payload: SendNotificationPayload): Promise<NotificationMaster> {
    const notification = await prisma.notificationMaster.create({
      data: {
        userId: payload.userId,
        companyId: payload.companyId,
        title: payload.title,
        message: payload.message,
        type: payload.type,
        entityType: payload.entityType,
        entityId: payload.entityId,
        priority: payload.priority ?? 'normal',
        status: 'pending',
        toAddress: payload.toAddress,
      },
    });

    return notification as NotificationMaster;
  }

  /**
   * Find notifications with filters
   */
  async findMany(filter: NotificationFilter): Promise<NotificationListResponse> {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    // सुरक्षा (P0): companyId के बिना query = दूसरी कंपनी का डेटा दिख सकता है।
    // इसलिए यहाँ fail-closed — बुलाने वाला भूल जाए तो query चलेगी ही नहीं।
    if (!filter.companyId) {
      throw new Error('companyId ज़रूरी है — tenant scope के बिना notification query नहीं चलेगी');
    }

    const where: any = { companyId: filter.companyId };
    if (filter.userId) where.userId = filter.userId;
    if (filter.type) where.type = filter.type;
    if (filter.status) where.status = filter.status;
    if (filter.entityType) where.entityType = filter.entityType;
    if (filter.priority) where.priority = filter.priority;
    if (filter.isRead !== undefined) {
      where.status = filter.isRead ? 'read' : { not: 'read' };
    }
    if (filter.startDate || filter.endDate) {
      where.createdAt = {};
      if (filter.startDate) where.createdAt.gte = filter.startDate;
      if (filter.endDate) where.createdAt.lte = filter.endDate;
    }

    const [data, total, unreadCount] = await Promise.all([
      prisma.notificationMaster.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notificationMaster.count({ where }),
      prisma.notificationMaster.count({
        where: {
          userId: filter.userId,
          companyId: filter.companyId,
          status: { not: 'read' },
        },
      }),
    ]);

    return {
      data: data as NotificationMaster[],
      total,
      page,
      limit,
      unreadCount,
    };
  }

  /**
   * Find single notification by ID
   */
  async findById(id: string, companyId: string): Promise<NotificationMaster | null> {
    const notification = await prisma.notificationMaster.findFirst({
      where: { id, companyId },
      include: { deliveryLogs: true },
    });

    return notification as NotificationMaster | null;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string, companyId: string): Promise<NotificationMaster | null> {
    // update({ where: { id } }) दूसरी कंपनी की row भी बदल देता — इसलिए updateMany + scope
    const result = await prisma.notificationMaster.updateMany({
      where: { id, companyId },
      data: { status: 'read', readAt: new Date() },
    });
    if (result.count === 0) return null;

    return prisma.notificationMaster.findFirst({ where: { id, companyId } }) as Promise<NotificationMaster | null>;
  }

  /**
   * Mark multiple notifications as read
   */
  async markManyAsRead(ids: string[], companyId: string): Promise<number> {
    const result = await prisma.notificationMaster.updateMany({
      where: { id: { in: ids }, companyId },
      data: { status: 'read', readAt: new Date() },
    });

    return result.count;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string, companyId: string): Promise<number> {
    const result = await prisma.notificationMaster.updateMany({
      where: {
        userId,
        companyId,
        status: { not: 'read' },
      },
      data: { status: 'read', readAt: new Date() },
    });

    return result.count;
  }

  /**
   * Get unread count for user
   */
  async getUnreadCount(userId: string, companyId: string): Promise<number> {
    return prisma.notificationMaster.count({
      where: {
        userId,
        companyId,
        status: { not: 'read' },
      },
    });
  }

  /**
   * Update notification status
   */
  async updateStatus(
    id: string,
    status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read'
  ): Promise<NotificationMaster> {
    const notification = await prisma.notificationMaster.update({
      where: { id },
      data: { status },
    });

    return notification as NotificationMaster;
  }

  /**
   * Create delivery log entry
   */
  async createDeliveryLog(
    notificationId: string,
    channel: string,
    status: string,
    providerResponse?: string,
    errorMessage?: string
  ): Promise<NotificationDeliveryLog> {
    const log = await prisma.notificationDeliveryLog.create({
      data: {
        notificationId,
        channel,
        status,
        providerResponse,
        errorMessage,
        attemptedAt: new Date(),
      },
    });

    return log as NotificationDeliveryLog;
  }

  /**
   * Get delivery logs for a notification
   */
  async getDeliveryLogs(notificationId: string, companyId: string): Promise<NotificationDeliveryLog[]> {
    // delivery log में पाने वाले का पता/नंबर होता है — इसलिए parent notification की कंपनी से बाँधना ज़रूरी
    const logs = await prisma.notificationDeliveryLog.findMany({
      where: { notificationId, notification: { companyId } },
      orderBy: { attemptedAt: 'desc' },
    });

    return logs as NotificationDeliveryLog[];
  }

  /**
   * Delete notification (soft delete pattern)
   */
  async delete(id: string, companyId: string): Promise<void> {
    await prisma.notificationMaster.updateMany({
      where: { id, companyId },
      data: { status: 'read', readAt: new Date() }, // Soft delete by marking read
    });
  }

  /**
   * Get pending notifications for batch processing
   *
   * ⚠️ जान-बूझकर बिना company scope के — यह अंदरूनी batch worker है जो हर कंपनी की
   * pending notification भेजता है। इसे कभी किसी HTTP route से मत बुलाना।
   */
  async getPendingNotifications(limit: number = 100): Promise<NotificationMaster[]> {
    const notifications = await prisma.notificationMaster.findMany({
      where: { status: 'pending' },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
      take: limit,
    });

    return notifications as NotificationMaster[];
  }
}

export const notificationRepository = NotificationRepository.getInstance();
