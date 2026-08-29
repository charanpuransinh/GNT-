/**
 * M16 — Notification Engine API Contract Tests
 */
import { describe, it, expect } from 'vitest';
import { sendNotificationSchema, notificationFilterSchema, markReadSchema } from '../../backend/src/modules/m16-notification/validators/notification.schema';

describe('M16 Notification — API Contract Tests', () => {
  describe('POST /api/v1/notifications/send', () => {
    it('should validate a correct send request', () => {
      const valid = {
        userId: 'a1b2c3d4-0000-0000-0000-000000000001',
        companyId: 'a1b2c3d4-0000-0000-0000-000000000002',
        title: 'Invoice Created',
        message: 'Invoice #123 has been created',
        type: 'in_app',
      };
      const result = sendNotificationSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject an invalid channel type', () => {
      const invalid = {
        userId: 'a1b2c3d4-0000-0000-0000-000000000001',
        companyId: 'a1b2c3d4-0000-0000-0000-000000000002',
        title: 'Invoice Created',
        message: 'Invoice #123 has been created',
        type: 'fax',
      };
      const result = sendNotificationSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject a missing message', () => {
      const invalid = {
        userId: 'a1b2c3d4-0000-0000-0000-000000000001',
        companyId: 'a1b2c3d4-0000-0000-0000-000000000002',
        title: 'Invoice Created',
        type: 'in_app',
      };
      const result = sendNotificationSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('GET /api/v1/notifications', () => {
    it('should validate a correct filter query', () => {
      const valid = { type: 'whatsapp', status: 'delivered', page: 1, limit: 20 };
      const result = notificationFilterSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject an invalid status value', () => {
      const invalid = { status: 'archived' };
      const result = notificationFilterSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('POST /api/v1/notifications/batch/read', () => {
    it('should validate markAll = true', () => {
      const valid = { markAll: true };
      const result = markReadSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should validate a list of notificationIds', () => {
      const valid = { notificationIds: ['a1b2c3d4-0000-0000-0000-000000000001'] };
      const result = markReadSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });
});
