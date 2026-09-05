/**
 * M19 — Health service ki jaanch (nakli prisma se, worst-status priority).
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import type { PrismaClient } from '@prisma/client';
import { HealthService } from '../../services/health.service';

const makePrisma = (statuses: string[]) =>
  ({
    systemHealth: {
      findMany: async () =>
        statuses.map((status, i) => ({
          id: `s${i}`, companyId: 'c1', serviceName: `svc${i}`, status,
          responseTimeMs: 10, lastCheckedAt: new Date(), errorCount: 0,
        })),
    },
  } as unknown as PrismaClient);

test('M19 health: sab healthy → overall healthy', async () => {
  const svc = new HealthService(makePrisma(['healthy', 'healthy', 'healthy']));
  const r = await svc.checkSystemHealth('c1');
  assert.equal(r.overall, 'healthy');
  assert.equal(r.services.length, 3);
});

test('M19 health: ek degraded → overall degraded', async () => {
  const svc = new HealthService(makePrisma(['healthy', 'degraded']));
  const r = await svc.checkSystemHealth('c1');
  assert.equal(r.overall, 'degraded');
});

test('M19 health: down sabse bhaari — healthy ke saath bhi down jeet-ta hai', async () => {
  const svc = new HealthService(makePrisma(['healthy', 'down', 'degraded']));
  const r = await svc.checkSystemHealth('c1');
  assert.equal(r.overall, 'down');
});

test('M19 health: unhealthy > degraded (priority sahi hai)', async () => {
  const svc = new HealthService(makePrisma(['unhealthy', 'degraded']));
  const r = await svc.checkSystemHealth('c1');
  assert.equal(r.overall, 'unhealthy');
});

test('M19 health: koi service nahi → default healthy', async () => {
  const svc = new HealthService(makePrisma([]));
  const r = await svc.checkSystemHealth('c1');
  assert.equal(r.overall, 'healthy');
});
