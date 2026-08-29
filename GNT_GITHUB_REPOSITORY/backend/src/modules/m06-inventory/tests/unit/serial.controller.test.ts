import { SerialController } from '../../controllers/serial.controller';

describe('SerialController', () => {
  const controller = new SerialController();
  it('✓ updates serial status', async () => {
    const req = { params: { id: 's1' }, body: { status: 'sold' }, tenant: { company_id: 'c1' } } as any;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
    await controller.updateSerialStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
