/**
 * M19 — Production & Monitoring Unit Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SecurityInternal } from '../../backend/services/security.internal';
import { SecurityService } from '../../backend/services/security.service';

const mockSecurityRepo = {
  getRecentFailedAttempts: vi.fn(),
  getEventsByIp: vi.fn(),
  createSecurityEvent: vi.fn(),
  getSecurityEvents: vi.fn(),
  resolveEvent: vi.fn(),
};
const mockAuditRepo = {} as any;

describe('M19 — SecurityInternal (anomaly rules)', () => {
  let internal: SecurityInternal;

  beforeEach(() => {
    vi.clearAllMocks();
    internal = new SecurityInternal(mockSecurityRepo as any, mockAuditRepo);
  });

  it('detects brute-force: 5+ failed logins for same user in 30 min', async () => {
    mockSecurityRepo.getRecentFailedAttempts.mockResolvedValue(5);
    mockSecurityRepo.getEventsByIp.mockResolvedValue(0);
    mockSecurityRepo.createSecurityEvent.mockResolvedValue({ id: 'e1', eventType: 'brute_force_detected' });

    const result = await internal.detectAnomaly({
      companyId: 'c1',
      eventType: 'user.login.failed',
      userId: 'u1',
      ipAddress: '1.2.3.4',
    } as any);

    expect(result.anomalyDetected).toBe(true);
    expect(mockSecurityRepo.createSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'brute_force_detected', severity: 'high' })
    );
  });

  it('does not flag brute-force below the 5-attempt threshold', async () => {
    mockSecurityRepo.getRecentFailedAttempts.mockResolvedValue(2);
    mockSecurityRepo.getEventsByIp.mockResolvedValue(0);

    const result = await internal.detectAnomaly({
      companyId: 'c1',
      eventType: 'user.login.failed',
      userId: 'u1',
    } as any);

    expect(result.anomalyDetected).toBe(false);
  });

  it('flags suspicious IP activity at 20+ events in 60 min', async () => {
    mockSecurityRepo.getRecentFailedAttempts.mockResolvedValue(0);
    mockSecurityRepo.getEventsByIp.mockResolvedValue(25);
    mockSecurityRepo.createSecurityEvent.mockResolvedValue({ id: 'e2', eventType: 'suspicious_ip_activity' });

    const result = await internal.detectAnomaly({
      companyId: 'c1',
      eventType: 'user.login.success',
      ipAddress: '5.6.7.8',
    } as any);

    expect(result.anomalyDetected).toBe(true);
    expect(mockSecurityRepo.createSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'suspicious_ip_activity', severity: 'critical' })
    );
  });

  it('always creates a permission_change_alert event on permission.changed', async () => {
    mockSecurityRepo.getRecentFailedAttempts.mockResolvedValue(0);
    mockSecurityRepo.getEventsByIp.mockResolvedValue(0);
    mockSecurityRepo.createSecurityEvent.mockResolvedValue({ id: 'e3', eventType: 'permission_change_alert' });

    const result = await internal.detectAnomaly({
      companyId: 'c1',
      eventType: 'permission.changed',
      userId: 'u2',
    } as any);

    expect(result.anomalyDetected).toBe(true);
  });
});

describe('M19 — SecurityService (public wrapper)', () => {
  it('reportEvent() delegates to SecurityInternal.detectAnomaly()', async () => {
    const internal = { detectAnomaly: vi.fn().mockResolvedValue({ anomalyDetected: false, events: [] }) } as any;
    const service = new SecurityService(internal);

    await service.reportEvent({ companyId: 'c1', eventType: 'user.login.success' } as any);
    expect(internal.detectAnomaly).toHaveBeenCalledTimes(1);
  });

  it('getSecurityEvents() delegates to SecurityInternal.getSecurityEvents()', async () => {
    const internal = { getSecurityEvents: vi.fn().mockResolvedValue([]) } as any;
    const service = new SecurityService(internal);

    await service.getSecurityEvents({ companyId: 'c1' } as any);
    expect(internal.getSecurityEvents).toHaveBeenCalledWith({ companyId: 'c1' });
  });

  it('resolveSecurityEvent() delegates to SecurityInternal.resolveSecurityEvent()', async () => {
    const internal = { resolveSecurityEvent: vi.fn().mockResolvedValue(undefined) } as any;
    const service = new SecurityService(internal);

    await service.resolveSecurityEvent('e1');
    expect(internal.resolveSecurityEvent).toHaveBeenCalledWith('e1');
  });
});
