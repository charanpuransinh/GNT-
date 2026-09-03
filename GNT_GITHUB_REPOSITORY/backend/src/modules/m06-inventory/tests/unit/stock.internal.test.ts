import { describe, it, expect, beforeEach, vi } from 'vitest';

// module-level repos (stock.internal.ts अंदर new StockRepository()/new ProductRepository() बनाता है)
// — factory से mock, ताकि असली prisma/DB न छूए
const mocks = vi.hoisted(() => ({
  getTotalQuantity: vi.fn(),
  findById: vi.fn(),
}));

vi.mock('../../repositories/stock.repository', () => ({
  StockRepository: class {
    getTotalQuantity = mocks.getTotalQuantity;
  },
}));

vi.mock('../../repositories/product.repository', () => ({
  ProductRepository: class {
    findById = mocks.findById;
  },
}));

import { StockInternalService } from '../../services/stock.internal';

describe('StockInternalService', () => {
  const service = new StockInternalService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('✓ calculateAvgPrice returns correct weighted average', () => {
    const avg = service.calculateAvgPrice(10, 100, 10, 120);
    expect(avg).toBe(110);
  });

  it('✓ calculateAvgPrice handles zero total qty', () => {
    const avg = service.calculateAvgPrice(0, 0, 0, 100);
    expect(avg).toBe(0);
  });

  it('✓ checkLowStock returns false when above reorder', async () => {
    mocks.findById.mockResolvedValue({ reorder_level: 10 });
    mocks.getTotalQuantity.mockResolvedValue(20);
    const result = await service.checkLowStock('p1', 'c1');
    expect(result).toBe(false);
  });

  it('✓ checkLowStock returns true when at/below reorder', async () => {
    mocks.findById.mockResolvedValue({ reorder_level: 10 });
    mocks.getTotalQuantity.mockResolvedValue(8);
    const result = await service.checkLowStock('p1', 'c1');
    expect(result).toBe(true);
  });

  it('✓ checkLowStock returns false when product has no reorder level', async () => {
    mocks.findById.mockResolvedValue({ reorder_level: null });
    const result = await service.checkLowStock('p1', 'c1');
    expect(result).toBe(false);
  });
});
