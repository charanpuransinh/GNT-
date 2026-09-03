import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';

import { SerialController } from '../../controllers/serial.controller';

describe.runIf(process.env.TEST_DB === '1')(
'SerialController', () => {
  const controller = new SerialController();
  it('✓ updates serial status', async () => {
    const req = { params: { id: 's1' }, body: { status: 'sold' }, tenant: { company_id: 'c1' } } as any;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
    await controller.updateSerialStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
