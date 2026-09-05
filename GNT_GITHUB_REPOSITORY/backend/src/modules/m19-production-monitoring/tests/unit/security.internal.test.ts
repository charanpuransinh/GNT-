/**
 * M19 — Security anomaly-detection rules ki jaanch (nakli repo se).
 * Rules: brute-force, suspicious IP, permission change, webhook failure.
 */
import { test, beforeEach, afterEach, vi } from 'vitest';
import assert from 'node:assert/strict';
import { SecurityInternal } from '../../services/security.internal';

// after-hours rule (22:00–06:00) time-dependent है — दिन के 12 बजे पर fix करो
// ताकि "sadhaaran event" test रात में भी deterministic रहे।
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-05T12:00:00Z'));
});
afterEach(() => {
  vi.useRealTimers();
});

const makeRepo = (opts: { failedCount?: number; ipEvents?: number } = {}) => {
  const events: any[] = [];
  const repo = {
    getRecentFailedAttempts: async () => opts.failedCount ?? 0,
    getEventsByIp: async () => opts.ipEvents ?? 0,
    createSecurityEvent: async (data: any) => {
      const ev = { id: `ev-${events.length + 1}`, createdAt: new Date(), ...data };
      events.push(ev);
      return ev;
    },
    getSecurityEvents: async () => events,
    resolveEvent: async () => true,
  };
  return { repo, events };
};

const makeInternal = (opts?: { failedCount?: number; ipEvents?: number }) => {
  const { repo, events } = makeRepo(opts);
  const internal = new SecurityInternal(repo as any, {} as any);
  return { internal, events };
};

test('M19 security: 5+ failed login → brute_force_detected (high)', async () => {
  const { internal, events } = makeInternal({ failedCount: 6 });
  const r = await internal.detectAnomaly({ companyId: 'c1', eventType: 'user.login.failed', userId: 'u1', ipAddress: '1.1.1.1' });
  assert.equal(r.anomalyDetected, true);
  assert.equal(events[0].eventType, 'brute_force_detected');
  assert.equal(events[0].severity, 'high');
});

test('M19 security: 4 failed login → threshold ke neeche, koi event nahi', async () => {
  const { internal, events } = makeInternal({ failedCount: 4 });
  const r = await internal.detectAnomaly({ companyId: 'c1', eventType: 'user.login.failed', userId: 'u1' });
  assert.equal(r.anomalyDetected, false);
  assert.equal(events.length, 0);
});

test('M19 security: 20+ IP events → suspicious_ip_activity (critical)', async () => {
  const { internal, events } = makeInternal({ ipEvents: 25 });
  const r = await internal.detectAnomaly({ companyId: 'c1', eventType: 'user.login.success', ipAddress: '9.9.9.9' });
  assert.equal(r.anomalyDetected, true);
  assert.equal(events[0].eventType, 'suspicious_ip_activity');
  assert.equal(events[0].severity, 'critical');
});

test('M19 security: permission change → permission_change_alert (medium)', async () => {
  const { internal, events } = makeInternal();
  const r = await internal.detectAnomaly({ companyId: 'c1', eventType: 'permission.changed', userId: 'u1' });
  assert.equal(r.anomalyDetected, true);
  assert.equal(events[0].eventType, 'permission_change_alert');
  assert.equal(events[0].severity, 'medium');
});

test('M19 security: webhook failure → integration_failure (medium)', async () => {
  const { internal, events } = makeInternal();
  const r = await internal.detectAnomaly({ companyId: 'c1', eventType: 'integration.webhook.failed' });
  assert.equal(r.anomalyDetected, true);
  assert.equal(events[0].eventType, 'integration_failure');
});

test('M19 security: sadhaaran event → koi anomaly nahi', async () => {
  const { internal, events } = makeInternal();
  const r = await internal.detectAnomaly({ companyId: 'c1', eventType: 'user.login.success', userId: 'u1', ipAddress: '1.1.1.1' });
  assert.equal(r.anomalyDetected, false);
  assert.equal(events.length, 0);
});
