import { StockInternalService } from '../../services/stock.internal';

describe('StockInternalService', () => {
  const service = new StockInternalService();

  it('✓ calculateAvgPrice returns correct weighted average', () => {
    const avg = service.calculateAvgPrice(10, 100, 10, 120);
    expect(avg).toBe(110);
  });

  it('✓ calculateAvgPrice handles zero total qty', () => {
    const avg = service.calculateAvgPrice(0, 0, 0, 100);
    expect(avg).toBe(0);
  });

  it('✓ checkLowStock returns false when above reorder', async () => {
    const { PrismaClient } = require('@prisma/client');
    jest.spyOn(PrismaClient.prototype.product_master, 'findFirst').mockResolvedValue({ reorder_level: 10 } as any);
    jest.spyOn(PrismaClient.prototype.stock_master, 'aggregate').mockResolvedValue({ _sum: { quantity: 20 } } as any);
    const result = await service.checkLowStock('p1', 'c1');
    expect(result).toBe(false);
  });
});
