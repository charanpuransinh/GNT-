// M12 — Tax slab service ki jaanch (DB-gated): progressive tax + overlap + empty
// NOTE: real TDS numbers owner admin screen se dalega — yahan sirf test-only FY use hota hai
//       (TEST-2099) taaki real FY (2026-27) ke slabs kabhi touch na ho.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/common/config/prisma';
import { taxSlabService } from './tax-slab.service';

const TEST_FY = 'TEST-2099';

async function cleanup() {
  await prisma.taxSlabMaster.deleteMany({ where: { financialYear: TEST_FY } });
}

describe.runIf(process.env.TEST_DB === '1')('M12 tax slab — live DB', () => {
  beforeAll(cleanup);
  afterAll(cleanup);

  it('progressive slab + 4% cess sahi tax deta hai', async () => {
    await taxSlabService.createSlabs([
      { financialYear: TEST_FY, regime: 'NEW', incomeFrom: 0, incomeTo: 400000, taxRatePercent: 0 },
      { financialYear: TEST_FY, regime: 'NEW', incomeFrom: 400001, incomeTo: 800000, taxRatePercent: 5 },
      { financialYear: TEST_FY, regime: 'NEW', incomeFrom: 800001, incomeTo: null, taxRatePercent: 10 },
    ]);

    // annual 6L → first 4L @ 0% + next 2L @ 5% = 10000; + 4% cess = 10400
    expect(await taxSlabService.calculateAnnualTax(600000, TEST_FY, 'NEW')).toBe(10400);
  });

  it('empty slabs → 0 (koi dummy placeholder nahi)', async () => {
    await cleanup();
    expect(await taxSlabService.calculateAnnualTax(600000, 'TEST-EMPTY', 'NEW')).toBe(0);
  });

  it('overlap validation: same range dobara → error', async () => {
    await taxSlabService.createSlabs([
      { financialYear: TEST_FY, regime: 'OLD', incomeFrom: 0, incomeTo: 300000, taxRatePercent: 0 },
    ]);
    await expect(
      taxSlabService.createSlabs([
        { financialYear: TEST_FY, regime: 'OLD', incomeFrom: 250000, incomeTo: 500000, taxRatePercent: 5 },
      ])
    ).rejects.toThrow(/Overlap/);
  });
});
