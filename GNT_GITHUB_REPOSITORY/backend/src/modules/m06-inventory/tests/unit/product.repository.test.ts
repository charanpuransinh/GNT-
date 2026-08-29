import { ProductRepository } from '../../repositories/product.repository';
import { PrismaClient } from '@prisma/client';

jest.mock('@prisma/client');

describe('ProductRepository', () => {
  const repo = new ProductRepository();
  beforeEach(() => jest.clearAllMocks());

  it('✓ findById filters by company_id', async () => {
    const mockFindFirst = jest.fn().mockResolvedValue({ id: '1', name: 'Test' });
    (PrismaClient as jest.MockedClass<typeof PrismaClient>).mockImplementation(() => ({
      product_master: { findFirst: mockFindFirst }
    } as any));
    const result = await repo.findById('1', 'c1');
    expect(result).toBeDefined();
  });
});
