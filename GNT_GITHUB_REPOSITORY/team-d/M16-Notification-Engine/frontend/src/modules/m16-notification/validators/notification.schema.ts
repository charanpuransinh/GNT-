/**
 * GNT M16 — Notification Engine Frontend Validation Schemas
 */

import { z } from 'zod';

export const notificationChannelSchema = z.enum(['in_app', 'whatsapp', 'sms', 'email']);
export const notificationPrioritySchema = z.enum(['low', 'normal', 'high', 'urgent']);
export const notificationStatusSchema = z.enum(['pending', 'sent', 'delivered', 'failed', 'read']);

export const notificationFilterSchema = z.object({
  type: notificationChannelSchema.optional(),
  status: notificationStatusSchema.optional(),
  priority: notificationPrioritySchema.optional(),
  isRead: z.boolean().optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export const markReadSchema = z.object({
  notificationIds: z.array(z.string().uuid()).optional(),
  markAll: z.boolean().optional(),
});

export type NotificationFilterInput = z.infer<typeof notificationFilterSchema>;
export type MarkReadInput = z.infer<typeof markReadSchema>;
