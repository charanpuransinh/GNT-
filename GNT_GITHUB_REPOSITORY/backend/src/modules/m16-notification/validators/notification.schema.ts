/**
 * GNT M16 — Notification Engine Validation Schemas
 * Zod schemas for input validation
 */

import { z } from 'zod';
import { NotificationChannel, NotificationPriority, NotificationEntityType } from '../types/notification.types';

export const notificationChannelSchema = z.enum(['in_app', 'whatsapp', 'sms', 'email']);
export const notificationPrioritySchema = z.enum(['low', 'normal', 'high', 'urgent']);
export const notificationStatusSchema = z.enum(['pending', 'sent', 'delivered', 'failed', 'read']);
export const notificationEntityTypeSchema = z.enum([
  'sales_invoice',
  'purchase_invoice',
  'payment',
  'stock',
  'gst_return',
  'employee_salary',
  'general',
]);

export const sendNotificationSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  companyId: z.string().uuid('Invalid company ID'),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  message: z.string().min(1, 'Message is required').max(2000, 'Message too long'),
  type: notificationChannelSchema,
  entityType: notificationEntityTypeSchema.default('general'),
  entityId: z.string().uuid().optional(),
  priority: notificationPrioritySchema.default('normal'),
  channels: z.array(notificationChannelSchema).optional(),
  toAddress: z.string().max(255).optional(),
});

export const notificationFilterSchema = z.object({
  userId: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
  type: notificationChannelSchema.optional(),
  status: notificationStatusSchema.optional(),
  entityType: notificationEntityTypeSchema.optional(),
  priority: notificationPrioritySchema.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isRead: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const markReadSchema = z.object({
  notificationIds: z.array(z.string().uuid()).optional(),
  markAll: z.boolean().optional(),
});

export const deliveryLogSchema = z.object({
  notificationId: z.string().uuid(),
  channel: notificationChannelSchema,
  status: z.enum(['attempted', 'delivered', 'failed', 'bounced']),
  providerResponse: z.string().optional(),
  errorMessage: z.string().optional(),
});

export const eventNotificationSchema = z.object({
  eventName: z.string().min(1),
  payload: z.record(z.string(), z.unknown()),
  targetUserIds: z.array(z.string().uuid()).optional(),
  targetRoles: z.array(z.string()).optional(),
  companyId: z.string().uuid(),
});

export type SendNotificationInput = z.infer<typeof sendNotificationSchema>;
export type NotificationFilterInput = z.infer<typeof notificationFilterSchema>;
export type MarkReadInput = z.infer<typeof markReadSchema>;
export type DeliveryLogInput = z.infer<typeof deliveryLogSchema>;
export type EventNotificationInput = z.infer<typeof eventNotificationSchema>;
