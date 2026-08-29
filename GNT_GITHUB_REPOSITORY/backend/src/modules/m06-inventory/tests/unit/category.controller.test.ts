import { CategoryController } from '../../controllers/category.controller';

describe('CategoryController', () => {
  const controller = new CategoryController();
  it('✓ returns 400 without company context', async () => {
    const req = { body: { name: 'Test' } } as any;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
    await controller.createCategory(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
