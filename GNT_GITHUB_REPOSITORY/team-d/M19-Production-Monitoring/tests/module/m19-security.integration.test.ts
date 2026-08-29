/**
 * M19 — Integration Tests
 * Exercises AuditService with a mocked repository across a realistic flow:
 * log a login-failed event 5 times -> anomaly triggers -> event stored -> resolved
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuditService } from '../../backend/services/audit.service';
import { SecurityInternal } from '../../backend/services/security.internal';
import { SecurityService } from '../../backend/services/security.service';

describe('M19 — Cross-service Integration', () => {
  const loginHistory: any[] = [];
  const securityEvents: any[] = [];

  const mockAuditRepo = {
    createAuditLog: vi.fn(),
    queryAuditLogs: vi.fn(),
    getLoginHistory: vi.fn(async () => loginHistory),
    createLoginHistory: vi.fn(async (entry: any) => {
      loginHistory.push(entry);
      return entry;
    }),
  } as any;

  const mockSecurityRepo = {
    getRecentFailedAttempts: vi.fn(async () => loginHistory.filter((l) => l.status === 'failed').length),
    getEventsByIp: vi.fn(async () => 0),
    createSecurityEvent: vi.fn(async (data: any) => {
      const event = { id: `evt-${securityEvents.length + 1}`, createdAt: new Date(), resolvedAt: null, ...data };
      securityEvents.push(event);
      return event;
    }),
    getSecurityEvents: vi.fn(async () => securityEvents),
    resolveEvent: vi.fn(async (id: string) => {
      const e = securityEvents.find((s) => s.id === id);
      if (e) e.resolvedAt = new Date();
    }),
  } as any;

  let auditService: AuditService;
  let securityService: SecurityService;

  beforeEach(() => {
    loginHistory.length = 0;
    securityEvents.length = 0;
    vi.clearAllMocks();
    auditService = new AuditService(mockAuditRepo);
    const internal = new SecurityInternal(mockSecurityRepo, mockAuditRepo);
    securityService = new SecurityService(internal);
  });

  it('5 failed logins for the same user trigger a resolvable brute-force event', async () => {
    for (let i = 0; i < 5; i++) {
      await auditService.recordLoginFailed('c1', 'u1', '10.0.0.1');
    }
    expect(loginHistory).toHaveLength(5);

    const result = await securityService.reportEvent({
      companyId: 'c1',
      eventType: 'user.login.failed',
      userId: 'u1',
      ipAddress: '10.0.0.1',
    } as any);

    expect(result.anomalyDetected).toBe(true);

    const events = await securityService.getSecurityEvents({ companyId: 'c1' } as any);
    expect(events).toHaveLength(1);
    expect(events[0].resolvedAt).toBeNull();

    await securityService.resolveSecurityEvent(events[0].id);
    const afterResolve = await securityService.getSecurityEvents({ companyId: 'c1' } as any);
    expect(afterResolve[0].resolvedAt).not.toBeNull();
  });
});
