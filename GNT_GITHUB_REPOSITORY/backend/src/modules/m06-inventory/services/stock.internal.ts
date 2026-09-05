// GNT M06 — Stock Internal Service (Calculations & Helpers)
import { prisma } from '@/common/config/prisma';
import { StockRepository } from '../repositories/stock.repository';
import { ProductRepository } from '../repositories/product.repository';
import { StockMovementDTO } from '../types/inventory.types';

const stockRepo = new StockRepository();
const productRepo = new ProductRepository();

export class StockInternalService {
  /**
   * Calculate average purchase price using weighted average
   */
  calculateAvgPrice(
    currentQty: number,
    currentAvgPrice: number,
    incomingQty: number,
    incomingRate: number
  ): number {
    const totalQty = currentQty + incomingQty;
    if (totalQty === 0) return 0;
    const totalValue = (currentQty * currentAvgPrice) + (incomingQty * incomingRate);
    return Number((totalValue / totalQty).toFixed(4));
  }

  /**
   * Check if stock is at or below reorder level
   */
  async checkLowStock(product_id: string, company_id: string, branch_id?: string | null): Promise<boolean> {
    const product = await productRepo.findById(product_id, company_id);
    if (!product || !product.reorder_level) return false;

    const totalQty = await stockRepo.getTotalQuantity(product_id, company_id, branch_id);
    return totalQty <= Number(product.reorder_level);
  }

  /**
   * Get FIFO batch for deduction
   */
  async getFIFOBatch(product_id: string, company_id: string): Promise<any | null> {
    const batches = await prisma.batch_master.findMany({
      where: { product_id, company_id, remaining_qty: { gt: 0 } },
      orderBy: { created_at: 'asc' },
      take: 1,
    });

    return batches[0] || null;
  }

  /**
   * Get LIFO batch for deduction
   */
  async getLIFOBatch(product_id: string, company_id: string): Promise<any | null> {
    const batches = await prisma.batch_master.findMany({
      where: { product_id, company_id, remaining_qty: { gt: 0 } },
      orderBy: { created_at: 'desc' },
      take: 1,
    });

    return batches[0] || null;
  }

  /**
   * Check batch expiry within days
   */
  async getExpiringBatches(company_id: string, days: number = 30): Promise<any[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);

    return prisma.batch_master.findMany({
      where: {
        company_id,
        expiry_date: { lte: cutoff, gte: new Date() },
        remaining_qty: { gt: 0 },
      },
      include: { product: true },
    });
  }
}
