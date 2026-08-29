/**
 * M19 — API Contract Tests
 * SecurityController now depends on SecurityService (public), not
 * SecurityInternal directly — this test locks that wiring in.
 */
import { describe, it, expect, vi } from 'vitest';
import { SecurityController } from '../../backend/controllers/security.controller';
import { anomalyCheckSchema, securityEventQuerySchema } from '../../backend/validators/security.schema';

describe('M19 — Security API Contract', () => {
  describe('validators', () => {
    it('accepts a valid anomaly-check payload', () => {
      const result = anomalyCheckSchema.safeParse({
        companyId: 'c1',
        eventType: 'user.login.failed',
        userId: 'u1',
        ipAddress: '10.0.0.1',
      });
      expect(result.success).toBe(true);
    });

    it('rejects an anomaly-check payload missing companyId', () => {
      const result = anomalyCheckSchema.safeParse({ eventType: 'user.login.failed' });
      expect(result.success).toBe(false);
    });

    it('accepts a valid security-events query', () => {
      const result = securityEventQuerySchema.safeParse({ companyId: 'c1', severity: 'high', resolved: 'true' });
      expect(result.success).toBe(true);
    });

    it('rejects an invalid severity value', () => {
      const result = securityEventQuerySchema.safeParse({ companyId: 'c1', severity: 'catastrophic' });
      expect(result.success).toBe(false);
    });
  });

  describe('POST /security/anomaly-check', () => {
    it('calls securityService.reportEvent() and returns 200 with the result', async () => {
      const mockService = { reportEvent: vi.fn().mockResolvedValue({ anomalyDetected: true, events: [] }) } as any;
      const controller = new SecurityController(mockService);

      const req: any = { body: { companyId: 'c1', eventType: 'user.login.failed', userId: 'u1' } };
      const res: any = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await controller.triggerAnomalyCheck(req, res);

      expect(mockService.reportEvent).toHaveBeenCalledWith(req.body);
      expect(res.json).toHaveBeenCalledWith({ anomalyDetected: true, events: [] });
      expect(res.status).not.toHaveBeenCalled();
    });

    it('returns 400 on invalid input instead of calling the service', async () => {
      const mockService = { reportEvent: vi.fn() } as any;
      const controller = new SecurityController(mockService);

      const req: any = { body: { eventType: 'user.login.failed' } }; // missing companyId
      const res: any = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await controller.triggerAnomalyCheck(req, res);

      expect(mockService.reportEvent).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('POST /security/events/:eventId/resolve', () => {
    it('calls securityService.resolveSecurityEvent() with the path param', async () => {
      const mockService = { resolveSecurityEvent: vi.fn().mockResolvedValue(undefined) } as any;
      const controller = new SecurityController(mockService);

      const req: any = { params: { eventId: 'evt-1' } };
      const res: any = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await controller.resolveEvent(req, res);

      expect(mockService.resolveSecurityEvent).toHaveBeenCalledWith('evt-1');
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });
  });
});
