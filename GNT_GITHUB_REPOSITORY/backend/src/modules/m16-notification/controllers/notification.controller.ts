/**
 * GNT M16 — Notification Controller
 * HTTP request handlers for notification endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service';
import {
  sendNotificationSchema,
  notificationFilterSchema,
  markReadSchema,
} from '../validators/notification.schema';

export class NotificationController {
  private static instance: NotificationController;

  private constructor() {}

  static getInstance(): NotificationController {
    if (!NotificationController.instance) {
      NotificationController.instance = new NotificationController();
    }
    return NotificationController.instance;
  }

  /**
   * POST /api/v1/notifications/send
   */
  async sendNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = sendNotificationSchema.parse(req.body);
      const result = await notificationService.sendNotification(validated);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/notifications
   */
  async listNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id as string;
      const companyId = req.user?.companyId as string;

      const filter = notificationFilterSchema.parse({
        ...req.query,
        userId,
        companyId,
      });

      const result = await notificationService.getNotifications(filter);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/notifications/:id/read
   */
  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id as string;
      const companyId = req.user?.companyId as string;

      const validated = markReadSchema.parse(req.body);
      const result = await notificationService.markAsRead(validated, userId, companyId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/notifications/unread-count
   */
  async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id as string;
      const companyId = req.user?.companyId as string;

      const result = await notificationService.getUnreadCount(userId, companyId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/notifications/delivery-log/:id
   */
  async getDeliveryLog(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const companyId = req.user?.companyId as string;
      const result = await notificationService.trackDelivery(id, companyId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/notifications/batch/read
   */
  async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id as string;
      const companyId = req.user?.companyId as string;

      const result = await notificationService.markAsRead({ markAll: true }, userId, companyId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = NotificationController.getInstance();
