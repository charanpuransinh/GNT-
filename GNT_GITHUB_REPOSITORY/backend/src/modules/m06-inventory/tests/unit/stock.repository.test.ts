import { StockRepository } from '../../repositories/stock.repository';

describe('StockRepository', () => {
  const repo = new StockRepository();

  it('✓ findOrCreate returns existing stock', async () => {
    const mockFindFirst = jest.fn().mockResolvedValue({ id: 's1', quantity: 10 });
    const mockCreate = jest.fn();
    jest.doMock('@prisma/client', () => ({
      PrismaClient: jest.fn().mockImplementation(() => ({
        stock_master: { findFirst: mockFindFirst, create: mockCreate }
      }))
    }));
    const result = await repo.findOrCreate({ company_id: 'c1', product_id: 'p1', quantity: 0 } as any);
    expect(result.quantity).toBe(10);
  });
});
