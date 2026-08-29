import { BatchController } from '../../controllers/batch.controller';

describe('BatchController', () => {
  const controller = new BatchController();
  it('✓ creates batch with valid data', async () => {
    const req = { body: { batch_number: 'B001', product_id: 'p1', quantity: 100 }, tenant: { company_id: 'c1' } } as any;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
    await controller.createBatch(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
