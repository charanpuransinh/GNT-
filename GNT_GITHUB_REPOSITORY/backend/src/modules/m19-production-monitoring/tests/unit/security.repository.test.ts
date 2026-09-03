/**
 * M19 — security event doosri company ki band nahi kar sakte.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import type { PrismaClient } from '@prisma/client';
import { SecurityRepository } from '../../repositories/security.repository';

const fakePrisma = {
  securityEvent: {
    updateMany: async (args: { where: Record<string, unknown> }) =>
      ({ count: args.where.companyId === 'c1' ? 1 : 0 }),
  },
} as unknown as PrismaClient;

test('M19: apni company ki event resolve hoti hai', async () => {
  const repo = new SecurityRepository(fakePrisma);
  assert.equal(await repo.resolveEvent('e1', 'c1'), true);
});

test('M19: doosri company ki event resolve nahi hoti (false lautta hai, 404 banega)', async () => {
  const repo = new SecurityRepository(fakePrisma);
  assert.equal(await repo.resolveEvent('e1', 'c2'), false);
});
