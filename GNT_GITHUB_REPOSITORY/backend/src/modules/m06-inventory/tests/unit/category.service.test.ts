import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi, type MockedClass, type Mocked } from 'vitest';

import { CategoryService } from '../../services/category.service';
import { CategoryRepository } from '../../repositories/category.repository';
import { ProductRepository } from '../../repositories/product.repository';

vi.mock('../../repositories/category.repository');
vi.mock('../../repositories/product.repository');

describe('CategoryService', () => {
  const service = new CategoryService();
  const mockCatRepo = CategoryRepository as MockedClass<typeof CategoryRepository>;
  const mockProdRepo = ProductRepository as MockedClass<typeof ProductRepository>;
  beforeEach(() => vi.clearAllMocks());

  it('✓ category tree returns nested structure', async () => {
    mockCatRepo.prototype.findTree.mockResolvedValue([
      { id: '1', name: 'Electronics', children: [{ id: '2', name: 'Mobiles', children: [] }] }
    ] as any);
    const result = await service.getCategoryTree('c1');
    expect((result[0] as { children?: unknown[] }).children).toHaveLength(1);
  });

  it('✓ category delete blocked if products exist', async () => {
    mockProdRepo.prototype.countByCategory.mockResolvedValue(5);
    await expect(service.deleteCategory('1', 'c1')).rejects.toThrow('Cannot delete category');
  });

  it('✓ category delete blocked if children exist', async () => {
    mockProdRepo.prototype.countByCategory.mockResolvedValue(0);
    mockCatRepo.prototype.hasChildren.mockResolvedValue(true);
    await expect(service.deleteCategory('1', 'c1')).rejects.toThrow('sub-categories');
  });

  it('✓ creates category successfully', async () => {
    mockCatRepo.prototype.create.mockResolvedValue({ id: '1', name: 'New Cat' } as any);
    const result = await service.createCategory({ company_id: 'c1', name: 'New Cat' });
    expect(result.name).toBe('New Cat');
  });
});
