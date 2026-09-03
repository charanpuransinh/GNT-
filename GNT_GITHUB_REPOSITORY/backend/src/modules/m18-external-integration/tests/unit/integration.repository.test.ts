/**
 * M18 — Gateway config sabhi companies ka leak na ho.
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import type { PrismaClient } from '@prisma/client';
import { IntegrationRepository } from '../../repositories/integration.repository';

const capture: { where?: Record<string, unknown> } = {};
const fakePrisma = {
  integration_config: {
    findMany: async (args: { where: Record<string, unknown> }) => { capture.where = args.where; return []; },
    count: async () => 0,
  },
} as unknown as PrismaClient;

test('M18: company_id ke bina integration list nahi milegi (fail-closed)', async () => {
  const repo = new IntegrationRepository(fakePrisma);
  await assert.rejects(() => repo.findIntegrations({ type: 'sms' } as never), /company_id/);
});

test('M18: company_id diya ho to where mein wahi jata hai', async () => {
  const repo = new IntegrationRepository(fakePrisma);
  await repo.findIntegrations({ company_id: 'c1' } as never);
  assert.equal(capture.where?.company_id, 'c1');
});

// ── IDOR band hone ki jaanch (id se doosri company ka data) ──
const otherCompanyPrisma = {
  integration_config: {
    findFirst: async (args: { where: Record<string, unknown> }) =>
      args.where.company_id === 'c1' ? { id: 'i1', company_id: 'c1' } : null,
    update: async () => ({ id: 'i1' }),
    delete: async () => ({ id: 'i1' }),
  },
  api_key_registry: {
    findFirst: async (args: { where: Record<string, unknown> }) =>
      args.where.company_id === 'c1' ? { id: 'k1', company_id: 'c1' } : null,
    delete: async () => ({ id: 'k1' }),
  },
} as unknown as PrismaClient;

test('M18: doosri company ki integration id se nahi milegi', async () => {
  const repo = new IntegrationRepository(otherCompanyPrisma);
  assert.equal(await repo.findIntegrationById('i1', 'c2'), null);
  assert.notEqual(await repo.findIntegrationById('i1', 'c1'), null);
});

test('M18: doosri company ki integration update/delete nahi hogi', async () => {
  const repo = new IntegrationRepository(otherCompanyPrisma);
  await assert.rejects(() => repo.updateIntegration('i1', 'c2', {} as never), /not found/);
  await assert.rejects(() => repo.deleteIntegration('i1', 'c2'), /not found/);
});

test('M18: doosri company ki API key revoke nahi hogi', async () => {
  const repo = new IntegrationRepository(otherCompanyPrisma);
  await assert.rejects(() => repo.deleteApiKey('k1', 'c2'), /not found/);
  assert.deepEqual(await repo.deleteApiKey('k1', 'c1'), { id: 'k1' });
});
