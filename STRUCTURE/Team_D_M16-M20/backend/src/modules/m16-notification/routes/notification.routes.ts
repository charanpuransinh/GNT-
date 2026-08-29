/**
 * GNT M16 — Notification Routes
 * Express route definitions
 */

import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';

const router = Router();

// POST /api/v1/notifications/send
router.post('/send', notificationController.sendNotification);

// GET /api/v1/notifications
router.get('/', notificationController.listNotifications);

// PATCH /api/v1/notifications/:id/read
router.patch('/:id/read', notificationController.markAsRead);

// GET /api/v1/notifications/unread-count
router.get('/unread-count', notificationController.getUnreadCount);

// GET /api/v1/notifications/delivery-log/:id
router.get('/delivery-log/:id', notificationController.getDeliveryLog);

// POST /api/v1/notifications/batch/read
router.post('/batch/read', notificationController.markAllAsRead);

export default router;
