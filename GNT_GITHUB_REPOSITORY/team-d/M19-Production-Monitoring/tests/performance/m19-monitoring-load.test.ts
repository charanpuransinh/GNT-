/**
 * M19 — Performance / Load Tests
 * Validates anomaly-detection and health-check paths stay responsive
 * under bulk load (repository mocked — tests service-layer throughput).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SecurityInternal } from '../../backend/services/security.internal';
import { SecurityService } from '../../backend/services/security.service';
import { HealthService } from '../../backend/services/health.service';

describe('M19 — Load Tests', () => {
  beforeEach(() => vi.clearAllMocks());

  it('processes 300 concurrent anomaly-check events within budget', async () => {
    const mockRepo = {
      getRecentFailedAttempts: vi.fn(async () => 0),
      getEventsByIp: vi.fn(async () => 0),
      createSecurityEvent: vi.fn(async (d: any) => ({ id: `e-${Math.random()}`, ...d })),
    } as any;
    const service = new SecurityService(new SecurityInternal(mockRepo, {} as any));

    const start = Date.now();
    const calls = Array.from({ length: 300 }, (_, i) =>
      service.reportEvent({ companyId: 'c1', eventType: 'user.login.success', userId: `u${i}` } as any)
    );
    const results = await Promise.all(calls);
    const durationMs = Date.now() - start;

    expect(results).toHaveLength(300);
    expect(durationMs).toBeLessThan(2000);
  });

  it('checkAllServices() completes the 5-service sweep within budget', async () => {
    const mockPrisma = {} as any;
    const health = new HealthService(mockPrisma);

    const start = Date.now();
    const results = await health.checkAllServices();
    const durationMs = Date.now() - start;

    expect(results).toHaveLength(5);
    expect(durationMs).toBeLessThan(1000);
  });
});
