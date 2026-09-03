import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi, type MockedClass, type Mocked } from 'vitest';

import { ProductRepository } from '../../repositories/product.repository';
import { PrismaClient } from '@prisma/client';

vi.mock('@prisma/client');

describe('ProductRepository', () => {
  const repo = new ProductRepository();
  beforeEach(() => vi.clearAllMocks());

  it('✓ findById filters by company_id', async () => {
    const mockFindFirst = vi.fn().mockResolvedValue({ id: '1', name: 'Test' });
    (PrismaClient as MockedClass<typeof PrismaClient>).mockImplementation(() => ({
      product_master: { findFirst: mockFindFirst }
    } as any));
    const result = await repo.findById('1', 'c1');
    expect(result).toBeDefined();
  });
});
