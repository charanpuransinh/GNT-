/**
 * M20 — FX (currency) service ki jaanch (DB ke bina, nakli prisma se).
 * Asli logic: same currency → 1:1 · convert → rate × amount · rate na mile → saaf error.
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import type { PrismaClient } from '@prisma/client';
import { FXService } from '../../services/fx.service';

const makeRate = (over: Record<string, unknown> = {}) => ({
  id: 'fx-1',
  company_id: 'c1',
  base_currency: 'USD',
  target_currency: 'INR',
  rate: 83.25,
  source: 'manual',
  effective_date: new Date('2026-09-01'),
  created_at: new Date(),
  ...over,
});

const makePrisma = (rate: Record<string, unknown> | null) =>
  ({
    fx_rate: { findFirst: async () => rate, findMany: async () => (rate ? [rate] : []), upsert: async () => rate },
  } as unknown as PrismaClient);

test('M20 FX: same currency — rate 1, koi DB call nahi', async () => {
  const svc = new FXService(makePrisma(null));
  const r = await svc.getFXRate('c1', 'INR', 'INR');
  assert.equal(r?.base_currency, 'INR');
  assert.equal(r?.target_currency, 'INR');
  assert.equal(Number(r?.rate), 1);
});

test('M20 FX: alag currency par repo se latest rate milta hai', async () => {
  const svc = new FXService(makePrisma(makeRate()));
  const r = await svc.getFXRate('c1', 'USD', 'INR');
  assert.equal(r?.base_currency, 'USD');
  assert.equal(r?.target_currency, 'INR');
  assert.equal(Number(r?.rate), 83.25);
});

test('M20 FX: convertAmount same currency — original = converted', async () => {
  const svc = new FXService(makePrisma(null));
  const c = await svc.convertAmount('c1', 500, 'INR', 'INR');
  assert.equal(c.converted_amount, 500);
  assert.equal(c.rate, 1);
});

test('M20 FX: convertAmount sahi rate se gunta hai (round 4 decimal)', async () => {
  const svc = new FXService(makePrisma(makeRate()));
  const c = await svc.convertAmount('c1', 100, 'USD', 'INR');
  assert.equal(c.converted_amount, 8325);
  assert.equal(c.rate, 83.25);
});

test('M20 FX: rate na mile to saaf error — chupchap 1:1 nahi', async () => {
  const svc = new FXService(makePrisma(null));
  await assert.rejects(
    () => svc.convertAmount('c1', 100, 'USD', 'INR'),
    /FX rate not found/
  );
});
