// M09 — GST effective-dated slabs ki jaanch (DB-gated): purani date par purana rate, nayi par naya
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/common/config/prisma';
import { GSTRepository } from './gst.repository';

const COMPANY_ID = '00000000-0000-4000-8000-000000000052';

async function cleanup() {
  await prisma.tax_rate_master.deleteMany({ where: { company_id: COMPANY_ID } });
}

describe.runIf(process.env.TEST_DB === '1')('M09 GST effective-dated — live DB', () => {
  beforeAll(async () => {
    await cleanup();
    // purana rate (2025) + naya rate (2026) — dono DB me saath
    await prisma.tax_rate_master.create({
      data: {
        company_id: COMPANY_ID, name: 'GST-5', cgst_rate: 2.5, sgst_rate: 2.5, igst_rate: 5, cess_rate: 0,
        effective_from: new Date('2025-01-01'), effective_to: new Date('2025-12-31'),
      },
    });
    await prisma.tax_rate_master.create({
      data: {
        company_id: COMPANY_ID, name: 'GST-18', cgst_rate: 9, sgst_rate: 9, igst_rate: 18, cess_rate: 0,
        effective_from: new Date('2026-01-01'), effective_to: null,
      },
    });
  });
  afterAll(cleanup);

  it('purani date par purana rate, nayi date par naya rate', async () => {
    const repo = new GSTRepository(prisma);

    const oldMap = await repo.getTaxSlabsAsMap(COMPANY_ID, new Date('2025-06-01'));
    expect(oldMap['GST-5']).toBeTruthy();
    expect(oldMap['GST-5'].igst_rate).toBe(5);
    expect(oldMap['GST-18']).toBeUndefined();

    const newMap = await repo.getTaxSlabsAsMap(COMPANY_ID, new Date('2026-06-01'));
    expect(newMap['GST-18']).toBeTruthy();
    expect(newMap['GST-18'].igst_rate).toBe(18);
    expect(newMap['GST-5']).toBeUndefined();
  });
});
