import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';

import { CategoryController } from '../../controllers/category.controller';

describe('CategoryController', () => {
  const controller = new CategoryController();
  it('✓ returns 400 without company context', async () => {
    const req = { body: { name: 'Test' } } as any;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
    await controller.createCategory(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
