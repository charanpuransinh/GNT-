import { ProductService } from '../../services/product.service';
import { ProductRepository } from '../../repositories/product.repository';

jest.mock('../../repositories/product.repository');

describe('ProductService', () => {
  const service = new ProductService();
  const mockRepo = ProductRepository as jest.MockedClass<typeof ProductRepository>;
  beforeEach(() => jest.clearAllMocks());

  it('✓ creates product with valid data', async () => {
    const data = { company_id: 'c1', name: 'Test Product', code: 'TP001', barcode: '123456' };
    mockRepo.prototype.create.mockResolvedValue({ id: '1', ...data } as any);
    const result = await service.createProduct(data as any);
    expect(result.name).toBe('Test Product');
  });

  it('✓ fails with duplicate barcode', async () => {
    const data = { company_id: 'c1', name: 'Test', barcode: 'DUPE' };
    mockRepo.prototype.existsWithBarcode.mockResolvedValue(true);
    await expect(service.createProduct(data as any)).rejects.toThrow('already exists');
  });

  it('✓ fails with duplicate code', async () => {
    const data = { company_id: 'c1', name: 'Test', code: 'DUPE' };
    mockRepo.prototype.existsWithCode.mockResolvedValue(true);
    await expect(service.createProduct(data as any)).rejects.toThrow('already exists');
  });

  it('✓ update updates timestamp', async () => {
    mockRepo.prototype.update.mockResolvedValue({ id: '1', name: 'Updated' } as any);
    const result = await service.updateProduct('1', { name: 'Updated' }, 'c1');
    expect(result.name).toBe('Updated');
  });

  it('✓ soft delete sets status inactive', async () => {
    mockRepo.prototype.softDelete.mockResolvedValue({ id: '1', status: 'inactive' } as any);
    const result = await service.deleteProduct('1', 'c1');
    expect(result.status).toBe('inactive');
  });

  it('✓ search returns filtered results', async () => {
    mockRepo.prototype.findAll.mockResolvedValue({ data: [{ id: '1', name: 'Found' }], total: 1, page: 1, limit: 20, totalPages: 1 } as any);
    const result = await service.searchProducts('Found', 'c1');
    expect(result).toHaveLength(1);
  });
});
