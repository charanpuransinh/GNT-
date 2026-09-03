/**
 * M17 — report config doosri company ka badla na ja sake
 * (updateConfig companyId leta tha par istemal nahi karta tha).
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import type { PrismaClient } from '@prisma/client';
import { ReportRepository } from '../../repositories/report.repository';

const fakePrisma = {
  reportConfig: {
    findFirst: async (args: { where: Record<string, unknown> }) =>
      args.where.companyId === 'c1' ? { id: 'r1', companyId: 'c1' } : null,
    update: async () => ({ id: 'r1' }),
  },
} as unknown as PrismaClient;

test('M17: doosri company ka report config update nahi hoga', async () => {
  const repo = new ReportRepository(fakePrisma);
  await assert.rejects(() => repo.updateConfig('r1', 'c2', {} as never), /not found/);
});

test('M17: apni company ka config update ho jata hai', async () => {
  const repo = new ReportRepository(fakePrisma);
  assert.deepEqual(await repo.updateConfig('r1', 'c1', {} as never), { id: 'r1' });
});
