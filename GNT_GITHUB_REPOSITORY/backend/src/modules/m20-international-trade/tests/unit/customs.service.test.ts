/**
 * M20 — Customs duty ganit ki jaanch (DB ke bina, nakli prisma se).
 * Yeh asli business logic hai: BCD → SWS → ACD/SAD/CVD → IGST base → IGST + Cess → total.
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import type { PrismaClient } from '@prisma/client';
import { CustomsService } from '../../services/customs.service';

type Rule = Record<string, unknown>;

const makeRule = (over: Rule = {}): Rule => ({
  company_id: 'c1', hsn_code: '84713010',
  bcd_rate: 10, sws_rate: 10, acd_rate: 0, sad_rate: 0, cvd_rate: 0,
  anti_dumping_rate: 0, safeguard_duty: 0,
  effective_from: new Date('2026-01-01'), effective_to: null,
  ...over,
});

const makePrisma = (rule: Rule | null, tariff: Record<string, unknown> | null) =>
  ({
    customs_rule: { findFirst: async () => rule },
    customs_tariff: { findFirst: async () => tariff },
    fx_rate: { findFirst: async () => null },
  } as unknown as PrismaClient);

test('M20: BCD, SWS aur IGST sahi jude — har line alag round hoti hai', async () => {
  const prisma = makePrisma(makeRule(), { code: '84713010', igst_rate: 18, cess_rate: 0, is_active: true });
  const svc = new CustomsService(prisma);

  const b = await svc.calculateCustomsDuty('c1', '84713010', 1000, 'INR');

  assert.equal(b.assessable_value_inr, 1000);
  assert.equal(b.bcd, 100);            // 1000 ka 10%
  assert.equal(b.sws, 10);             // BCD ka 10% (value ka nahi)
  assert.equal(b.igst, 200);           // (1000+100+10) ka 18% = 199.8 → 200
  assert.equal(b.cess, 0);
  assert.equal(b.total_duty, 310);     // 100+10+200
});

test('M20: cess customs_tariff se aata hai, code mein 0 jama nahi', async () => {
  const prisma = makePrisma(makeRule(), { code: '24022090', igst_rate: 28, cess_rate: 5, is_active: true });
  const svc = new CustomsService(prisma);

  const b = await svc.calculateCustomsDuty('c1', '24022090', 1000, 'INR');

  assert.equal(b.cess, 56);            // 1110 ka 5% = 55.5 → 56
  assert.ok(b.total_duty > b.igst, 'cess total mein juda hona chahiye');
});

test('M20: FX rate diya ho to value INR mein badalti hai', async () => {
  const prisma = makePrisma(makeRule(), { code: '84713010', igst_rate: 18, cess_rate: 0, is_active: true });
  const svc = new CustomsService(prisma);

  const b = await svc.calculateCustomsDuty('c1', '84713010', 100, 'USD', 80);

  assert.equal(b.assessable_value_inr, 8000);
  assert.equal(b.bcd, 800);
});

test('M20: rule na mile to saaf error — chupchap 0 duty nahi', async () => {
  const prisma = makePrisma(null, { code: 'x', igst_rate: 18, cess_rate: 0, is_active: true });
  const svc = new CustomsService(prisma);

  await assert.rejects(() => svc.calculateCustomsDuty('c1', 'x', 1000, 'INR'), /CUSTOMS_RULE_MISSING|No customs rule/);
});

test('M20: HSN (customs_tariff) na mile to saaf error', async () => {
  const prisma = makePrisma(makeRule(), null);
  const svc = new CustomsService(prisma);

  await assert.rejects(() => svc.calculateCustomsDuty('c1', '99999999', 1000, 'INR'), /HSN_RATE_MISSING|not found/);
});

test('M20: har duty line breakup mein dikhti hai (9 lines)', async () => {
  const prisma = makePrisma(makeRule(), { code: '84713010', igst_rate: 18, cess_rate: 0, is_active: true });
  const svc = new CustomsService(prisma);

  const b = await svc.calculateCustomsDuty('c1', '84713010', 1000, 'INR');

  assert.equal(b.breakup.length, 9);
  assert.equal(b.breakup[0].label, 'Basic Customs Duty (BCD)');
});
