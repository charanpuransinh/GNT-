/**
 * M19 — Audit trail sabse sanvedansheel hai: companyId chhoot jaye to
 * har company ka itihaas khul jata tha (Prisma undefined shart ko hata deta hai).
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import type { PrismaClient } from '@prisma/client';
import { AuditRepository } from '../../repositories/audit.repository';

const capture: { where?: Record<string, unknown> } = {};
const fakePrisma = {
  auditLog: {
    findMany: async (args: { where: Record<string, unknown> }) => { capture.where = args.where; return []; },
    count: async () => 0,
  },
} as unknown as PrismaClient;

test('M19: companyId ke bina audit log nahi milega (fail-closed)', async () => {
  const repo = new AuditRepository(fakePrisma);
  await assert.rejects(() => repo.queryAuditLogs({ page: 1, limit: 20 } as never), /companyId/);
});

test('M19: companyId diya ho to where mein wahi jata hai', async () => {
  const repo = new AuditRepository(fakePrisma);
  await repo.queryAuditLogs({ companyId: 'c1', page: 1, limit: 20 } as never);
  assert.equal(capture.where?.companyId, 'c1');
});
