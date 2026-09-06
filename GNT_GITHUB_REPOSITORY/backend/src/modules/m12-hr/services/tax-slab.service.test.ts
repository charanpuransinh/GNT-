// M12 — Tax slab service ki jaanch (DB-gated): progressive tax + overlap + empty
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/common/config/prisma';
import { taxSlabService } from './tax-slab.service';

async function cleanup() {
  await prisma.taxSlabMaster.deleteMany({});
}

describe.runIf(process.env.TEST_DB === '1')('M12 tax slab — live DB', () => {
  beforeAll(cleanup);
  afterAll(cleanup);

  it('progressive slab + 4% cess sahi tax deta hai', async () => {
    await taxSlabService.createSlabs([
      { financialYear: '2026-27', regime: 'NEW', incomeFrom: 0, incomeTo: 400000, taxRatePercent: 0 },
      { financialYear: '2026-27', regime: 'NEW', incomeFrom: 400000, incomeTo: 800000, taxRatePercent: 5 },
      { financialYear: '2026-27', regime: 'NEW', incomeFrom: 800000, incomeTo: null, taxRatePercent: 10 },
    ]);

    // annual 6L → (2L @ 5%) = 10000; + 4% cess = 10400
    expect(await taxSlabService.calculateAnnualTax(600000, '2026-27', 'NEW')).toBe(10400);
  });

  it('empty slabs → 0 (koi dummy placeholder nahi)', async () => {
    await cleanup();
    expect(await taxSlabService.calculateAnnualTax(600000, '2027-28', 'NEW')).toBe(0);
  });

  it('overlap validation: same range dobara → error', async () => {
    await taxSlabService.createSlabs([
      { financialYear: '2026-27', regime: 'OLD', incomeFrom: 0, incomeTo: 300000, taxRatePercent: 0 },
    ]);
    await expect(
      taxSlabService.createSlabs([
        { financialYear: '2026-27', regime: 'OLD', incomeFrom: 250000, incomeTo: 500000, taxRatePercent: 5 },
      ])
    ).rejects.toThrow(/Overlap/);
  });
});
