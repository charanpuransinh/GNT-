import { describe, it, expect, afterAll, vi } from 'vitest';

import { prisma } from '@/common/config/prisma';
import { SerialController } from '../../controllers/serial.controller';

// असली DB पर (TEST_DB=1) — m06 columns @db.Uuid हैं, इसलिए असली UUIDs चाहिए
const COMPANY_ID = '11111111-1111-4111-8111-111111111111';
const PRODUCT_ID = '33333333-3333-4333-8333-333333333333';
const SERIAL_ID = '44444444-4444-4444-8444-444444444444';

describe.runIf(process.env.TEST_DB === '1')(
'SerialController', () => {
  const controller = new SerialController();

  afterAll(async () => {
    await prisma.serial_master.deleteMany({ where: { id: SERIAL_ID } });
    await prisma.product_master.deleteMany({ where: { id: PRODUCT_ID } });
  });

  it('✓ updates serial status', async () => {
    await prisma.product_master.create({
      data: { id: PRODUCT_ID, company_id: COMPANY_ID, name: 'Serial Test Product' },
    });
    await prisma.serial_master.create({
      data: { id: SERIAL_ID, company_id: COMPANY_ID, product_id: PRODUCT_ID, serial_number: 'SN-001', status: 'in_stock' },
    });

    const req = { params: { id: SERIAL_ID }, body: { status: 'sold' }, tenant: { companyId: COMPANY_ID } };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    await controller.updateSerialStatus(req as never, res as never);
    expect(res.json).toHaveBeenCalled();
    const payload = vi.mocked(res.json).mock.calls[0]?.[0] as { success: boolean };
    expect(payload.success).toBe(true);
  });
});
