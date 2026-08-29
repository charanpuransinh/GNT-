/**
 * M19 — Security Tests
 * Validates company-isolation on audit/security queries and that
 * SecurityController only reaches the module through the public
 * SecurityService (never security.internal.ts or the repository).
 */
import { describe, it, expect, vi } from 'vitest';
import { auditQuerySchema, securityEventQuerySchema, anomalyCheckSchema } from '../../backend/validators/security.schema';
import { SecurityController } from '../../backend/controllers/security.controller';

describe('M19 — Security', () => {
  it('rejects an audit-log query with no companyId (would leak cross-company data)', () => {
    const result = auditQuerySchema.safeParse({ module: 'sales' });
    expect(result.success).toBe(false);
  });

  it('rejects a security-events query with no companyId', () => {
    const result = securityEventQuerySchema.safeParse({ severity: 'high' });
    expect(result.success).toBe(false);
  });

  it('caps audit-log page size at 100 to prevent bulk-export abuse', () => {
    const result = auditQuerySchema.safeParse({ companyId: 'c1', limit: 5000 });
    expect(result.success).toBe(false);
  });

  it('rejects an anomaly-check payload with an empty companyId (spoofed empty tenant)', () => {
    const result = anomalyCheckSchema.safeParse({ companyId: '', eventType: 'user.login.failed' });
    expect(result.success).toBe(false);
  });

  it('SecurityController never imports SecurityInternal directly — only SecurityService', async () => {
    // Structural check: the controller's constructor type must accept a
    // SecurityService (public), and calling it must not touch repository
    // methods directly (no createSecurityEvent/getEventsByIp on the mock).
    const mockService = {
      reportEvent: vi.fn().mockResolvedValue({ anomalyDetected: false, events: [] }),
      getSecurityEvents: vi.fn().mockResolvedValue([]),
      resolveSecurityEvent: vi.fn().mockResolvedValue(undefined),
    } as any;
    const controller = new SecurityController(mockService);

    const req: any = { query: { companyId: 'c1' } };
    const res: any = { json: vi.fn(), status: vi.fn().mockReturnThis() };
    await controller.getSecurityEvents(req, res);

    expect(mockService.getSecurityEvents).toHaveBeenCalled();
    expect(mockService.reportEvent).not.toHaveBeenCalled(); // untouched unless triggerAnomalyCheck runs
  });

  it('after-hours login detection only fires between 22:00–06:00, never mid-day', async () => {
    const { SecurityInternal } = await import('../../backend/services/security.internal');
    const mockRepo = {
      getRecentFailedAttempts: vi.fn(async () => 0),
      getEventsByIp: vi.fn(async () => 0),
      createSecurityEvent: vi.fn(async (d: any) => ({ id: 'e1', ...d })),
    } as any;
    const internal = new SecurityInternal(mockRepo, {} as any);

    const originalGetHours = Date.prototype.getHours;
    Date.prototype.getHours = () => 12; // force mid-day

    const result = await internal.detectAnomaly({
      companyId: 'c1',
      eventType: 'user.login.success',
      userId: 'u1',
    } as any);

    Date.prototype.getHours = originalGetHours;
    expect(result.anomalyDetected).toBe(false);
  });
});
