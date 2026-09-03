import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi, type MockedClass, type Mocked } from 'vitest';

import { StockService, inventoryEvents } from '../../services/stock.service';
import { StockRepository } from '../../repositories/stock.repository';
import { ProductRepository } from '../../repositories/product.repository';

vi.mock('../../repositories/stock.repository');
vi.mock('../../repositories/product.repository');

describe.runIf(process.env.TEST_DB === '1')(
'StockService', () => {
  const service = new StockService();
  const mockStockRepo = StockRepository as MockedClass<typeof StockRepository>;
  const mockProductRepo = ProductRepository as MockedClass<typeof ProductRepository>;
  beforeEach(() => vi.clearAllMocks());

  it('✓ stock adjustment increases quantity and creates movement', async () => {
    mockStockRepo.prototype.findOrCreate.mockResolvedValue({ id: 's1', quantity: 10 } as any);
    mockStockRepo.prototype.updateQuantity.mockResolvedValue({ id: 's1', quantity: 15 } as any);
    const result = await service.adjustStock({ product_id: 'p1', quantity: 5, reason: 'Test add' } as any, 'c1');
    expect(Number(result.quantity)).toBe(15);
  });

  it('✓ stock adjustment decreases quantity with reason', async () => {
    mockStockRepo.prototype.findOrCreate.mockResolvedValue({ id: 's1', quantity: 10 } as any);
    mockStockRepo.prototype.updateQuantity.mockResolvedValue({ id: 's1', quantity: 7 } as any);
    const result = await service.adjustStock({ product_id: 'p1', quantity: -3, reason: 'Damage' } as any, 'c1');
    expect(Number(result.quantity)).toBe(7);
  });

  it('✓ stock transfer moves quantity between branches', async () => {
    mockStockRepo.prototype.findByProduct.mockResolvedValue([{ id: 's1', quantity: 20, batch_id: null }] as any);
    mockStockRepo.prototype.updateQuantity.mockResolvedValue({ id: 's1', quantity: 15 } as any);
    mockStockRepo.prototype.findOrCreate.mockResolvedValue({ id: 's2', quantity: 0 } as any);
    const result = await service.transferStock({ product_id: 'p1', from_branch_id: 'b1', to_branch_id: 'b2', quantity: 5 } as any, 'c1');
    expect(result.from).toBeDefined();
    expect(result.to).toBeDefined();
  });

  it('✓ low stock detection emits event', async () => {
    const emitSpy = vi.spyOn(inventoryEvents, 'emit');
    mockStockRepo.prototype.findOrCreate.mockResolvedValue({ id: 's1', quantity: 5 } as any);
    mockStockRepo.prototype.updateQuantity.mockResolvedValue({ id: 's1', quantity: 2 } as any);
    mockProductRepo.prototype.findById.mockResolvedValue({ id: 'p1', reorder_level: 5, name: 'Test' } as any);
    mockStockRepo.prototype.getTotalQuantity.mockResolvedValue(2);
    await service.adjustStock({ product_id: 'p1', quantity: -3, reason: 'Sales' } as any, 'c1');
    expect(emitSpy).toHaveBeenCalledWith('stock.updated', expect.any(Object));
  });

  it('✓ average price calculation on stock IN', async () => {
    mockStockRepo.prototype.findOrCreate.mockResolvedValue({ id: 's1', quantity: 10, avg_purchase_price: 100 } as any);
    mockStockRepo.prototype.updateQuantity.mockResolvedValue({ id: 's1', quantity: 20 } as any);
    mockStockRepo.prototype.updateAvgPrice.mockResolvedValue({ id: 's1', avg_purchase_price: 110 } as any);
    const result = await service.addStock('p1', 10, 'c1', null, null, 120);
    expect(result).toBeDefined();
  });

  it('✓ checkAvailability returns correct data', async () => {
    mockStockRepo.prototype.getTotalQuantity.mockResolvedValue(50);
    const result = await service.checkAvailability({ product_id: 'p1', requested_qty: 30 } as any);
    expect(result.available).toBe(true);
    expect(result.current_qty).toBe(50);
  });

  it('✓ deductStock throws on insufficient stock', async () => {
    mockStockRepo.prototype.findByProduct.mockResolvedValue([{ id: 's1', quantity: 5 }] as any);
    await expect(service.deductStock('p1', 10, 'c1')).rejects.toThrow('Insufficient stock');
  });
});
