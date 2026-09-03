import { describe, it, expect, afterAll, vi } from 'vitest';

import { prisma } from '@/common/config/prisma';
import { BatchController } from '../../controllers/batch.controller';

// असली DB पर (TEST_DB=1) — m06 columns @db.Uuid हैं, इसलिए असली UUIDs चाहिए
const COMPANY_ID = '11111111-1111-4111-8111-111111111111';
const PRODUCT_ID = '55555555-5555-4555-8555-555555555555';

describe.runIf(process.env.TEST_DB === '1')(
'BatchController', () => {
  const controller = new BatchController();

  afterAll(async () => {
    await prisma.batch_master.deleteMany({ where: { company_id: COMPANY_ID } });
    await prisma.product_master.deleteMany({ where: { id: PRODUCT_ID } });
  });

  it('✓ creates batch with valid data', async () => {
    await prisma.product_master.create({
      data: { id: PRODUCT_ID, company_id: COMPANY_ID, name: 'Batch Test Product' },
    });

    const req = {
      body: { company_id: COMPANY_ID, product_id: PRODUCT_ID, batch_number: 'B001', quantity: 100, remaining_qty: 100 },
      tenant: { companyId: COMPANY_ID },
    };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    await controller.createBatch(req as never, res as never);
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
