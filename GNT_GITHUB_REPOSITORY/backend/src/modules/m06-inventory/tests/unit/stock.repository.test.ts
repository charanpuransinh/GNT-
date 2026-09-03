import { describe, it, expect, afterAll } from 'vitest';

import { prisma } from '@/common/config/prisma';
import { StockRepository } from '../../repositories/stock.repository';

// असली DB पर चलता है (TEST_DB=1) — असली UUIDs चाहिए (m06 columns @db.Uuid हैं)
const COMPANY_ID = '11111111-1111-4111-8111-111111111111';
const PRODUCT_ID = '22222222-2222-4222-8222-222222222222';

describe.runIf(process.env.TEST_DB === '1')(
'StockRepository', () => {
  const repo = new StockRepository();

  afterAll(async () => {
    await prisma.stock_master.deleteMany({ where: { company_id: COMPANY_ID } });
    await prisma.product_master.deleteMany({ where: { id: PRODUCT_ID } });
  });

  it('✓ findOrCreate बनाता है फिर वही लौटाता है (existing stock)', async () => {
    await prisma.product_master.create({
      data: { id: PRODUCT_ID, company_id: COMPANY_ID, name: 'Repo Test Product' },
    });
    await repo.findOrCreate({ company_id: COMPANY_ID, product_id: PRODUCT_ID, quantity: 0 });
    const existing = await repo.findOrCreate({ company_id: COMPANY_ID, product_id: PRODUCT_ID, quantity: 5 });
    expect(Number(existing.quantity)).toBe(0);
  });
});
