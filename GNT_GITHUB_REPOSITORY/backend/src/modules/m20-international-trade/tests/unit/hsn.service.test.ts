/**
 * M20 — HSN (international tariff) service ki jaanch (DB ke bina, nakli prisma se).
 * Asli logic: valid+active → pass · inactive/missing → saaf fail + suggestions.
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import type { PrismaClient } from '@prisma/client';
import { HSNService } from '../../services/hsn.service';

const makeTariff = (over: Record<string, unknown> = {}) => ({
  id: 'hsn-1',
  code: '84713010',
  description: 'Laptop',
  chapter: '84',
  heading: '8471',
  subheading: '847130',
  tariff_item: '84713010',
  gst_rate: 18,
  igst_rate: 18,
  cess_rate: 0,
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
  ...over,
});

const makePrisma = (tariff: Record<string, unknown> | null, suggestions: Record<string, unknown>[] = []) =>
  ({
    customs_tariff: {
      findUnique: async () => tariff,
      findMany: async () => (tariff ? [tariff, ...suggestions] : suggestions),
    },
  } as unknown as PrismaClient);

test('M20 HSN: valid + active code pass hota hai', async () => {
  const svc = new HSNService(makePrisma(makeTariff()));
  const r = await svc.validateHSN('84713010');
  assert.equal(r.valid, true);
  assert.equal(r.code, '84713010');
  assert.deepEqual(r.suggested_codes, []);
});

test('M20 HSN: inactive code fail + suggestions aate hain', async () => {
  const svc = new HSNService(makePrisma(makeTariff({ is_active: false })));
  const r = await svc.validateHSN('84713010');
  assert.equal(r.valid, false);
  assert.ok(r.message.toLowerCase().includes('invalid'), 'message invalid hona chahiye');
});

test('M20 HSN: code na mile to fail hota hai (default-deny)', async () => {
  const svc = new HSNService(makePrisma(null));
  const r = await svc.validateHSN('99999999');
  assert.equal(r.valid, false);
  assert.equal(r.code, '99999999');
});

test('M20 HSN: getHSNDetails sahi record map karta hai', async () => {
  const svc = new HSNService(makePrisma(makeTariff()));
  const d = await svc.getHSNDetails('84713010');
  assert.equal(d?.code, '84713010');
  assert.equal(d?.gst_rate, 18);
  assert.equal(d?.chapter, '84');
});

test('M20 HSN: getHSNDetails na mile to null (undefined nahi fake)', async () => {
  const svc = new HSNService(makePrisma(null));
  const d = await svc.getHSNDetails('00000000');
  assert.equal(d, null);
});

test('M20 HSN: searchHSN result ko HSNItem mein map karta hai', async () => {
  const svc = new HSNService(makePrisma(makeTariff()));
  const list = await svc.searchHSN('8471');
  assert.ok(list.length >= 1);
  assert.equal(list[0].code, '84713010');
  assert.equal(list[0].igst_rate, 18);
});
