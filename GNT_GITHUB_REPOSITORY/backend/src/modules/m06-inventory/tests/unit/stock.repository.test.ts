import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';

import { StockRepository } from '../../repositories/stock.repository';

describe.runIf(process.env.TEST_DB === '1')(
'StockRepository', () => {
  const repo = new StockRepository();

  it('✓ findOrCreate returns existing stock', async () => {
    const mockFindFirst = vi.fn().mockResolvedValue({ id: 's1', quantity: 10 });
    const mockCreate = vi.fn();
    vi.doMock('@prisma/client', () => ({
      PrismaClient: vi.fn().mockImplementation(() => ({
        stock_master: { findFirst: mockFindFirst, create: mockCreate }
      }))
    }));
    const result = await repo.findOrCreate({ company_id: 'c1', product_id: 'p1', quantity: 0 } as any);
    expect(result.quantity).toBe(10);
  });
});
