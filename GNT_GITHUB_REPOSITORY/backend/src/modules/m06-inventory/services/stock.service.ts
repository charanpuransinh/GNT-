// GNT M06 — Stock Service (PUBLIC INTERFACE)
import { StockRepository } from '../repositories/stock.repository';
import { ProductRepository } from '../repositories/product.repository';
import { StockInternalService } from './stock.internal';
import {
  StockDTO,
  StockAdjustmentInput,
  StockTransferInput,
  AvailabilityCheckInput,
  AvailabilityResult,
  StockFilter,
  MovementFilter,
  PaginatedResult,
  StockMovementDTO,
} from '../types/inventory.types';
import { stock_master, stock_movement } from '@prisma/client';
import { EventEmitter } from 'events';

export const inventoryEvents = new EventEmitter();

const stockRepo = new StockRepository();
const productRepo = new ProductRepository();
const stockInternal = new StockInternalService();

export class StockService {
  // ─── PUBLIC API: checkAvailability ───
  async checkAvailability(input: AvailabilityCheckInput, companyId?: string): Promise<AvailabilityResult> {
    // TODO: company_id should be injected via middleware/context in real app
    if (!companyId) {
      throw new Error('Company context is required for stock availability check');
    }

    const currentQty = await stockRepo.getTotalQuantity(
      input.product_id,
      companyId,
      input.branch_id
    );

    return {
      available: currentQty >= input.requested_qty,
      current_qty: currentQty,
      requested_qty: input.requested_qty,
      product_id: input.product_id,
      branch_id: input.branch_id,
    };
  }

  // ─── PUBLIC API: deductStock ───
  async deductStock(
    product_id: string,
    quantity: number,
    company_id: string,
    branch_id?: string | null,
    batch_id?: string | null,
    reference_type?: string,
    reference_id?: string
  ): Promise<stock_master> {
    const stockRecords = await stockRepo.findByProduct(product_id, company_id, branch_id);
    if (stockRecords.length === 0) throw new Error('Stock not found for product');

    let remainingQty = quantity;
    let primaryStock = stockRecords[0];

    // If batch specified, use that batch
    if (batch_id) {
      const batchStock = stockRecords.find(s => s.batch_id === batch_id);
      if (!batchStock) throw new Error('Batch stock not found');
      primaryStock = batchStock;
    }

    const beforeQty = Number(primaryStock.quantity);
    if (beforeQty < remainingQty) {
      throw new Error(`Insufficient stock. Available: ${beforeQty}, Requested: ${remainingQty}`);
    }

    const afterQty = beforeQty - remainingQty;
    const updatedStock = await stockRepo.updateQuantity(primaryStock.id, afterQty, company_id);

    // Log movement
    await stockRepo.createMovement({
      company_id,
      product_id,
      batch_id: primaryStock.batch_id,
      branch_id: branch_id || null,
      reference_type: reference_type || null,
      reference_id: reference_id || null,
      movement_type: 'out',
      quantity: remainingQty,
      before_qty: beforeQty,
      after_qty: afterQty,
      notes: `Stock deducted via ${reference_type || 'manual'}`,
    } as StockMovementDTO);

    // Check low stock
    const isLow = await stockInternal.checkLowStock(product_id, company_id, branch_id);
    if (isLow) {
      const product = await productRepo.findById(product_id, company_id);
      inventoryEvents.emit('stock.low', {
        product_id,
        branch_id,
        current_qty: afterQty,
        reorder_level: product?.reorder_level,
        product_name: product?.name,
      });
    }

    // Emit stock updated
    inventoryEvents.emit('stock.updated', {
      product_id,
      branch_id,
      before_qty: beforeQty,
      after_qty: afterQty,
      reference_type,
      reference_id,
    });

    return updatedStock;
  }

  // ─── PUBLIC API: addStock ───
  async addStock(
    product_id: string,
    quantity: number,
    company_id: string,
    branch_id?: string | null,
    batch_id?: string | null,
    rate?: number | null,
    reference_type?: string,
    reference_id?: string
  ): Promise<stock_master> {
    const stockRecord = await stockRepo.findOrCreate({
      company_id,
      product_id,
      branch_id: branch_id || null,
      batch_id: batch_id || null,
      quantity: 0,
    } as StockDTO);

    const beforeQty = Number(stockRecord.quantity);
    const afterQty = beforeQty + quantity;

    // Calculate new average price if rate provided
    let avgPrice = stockRecord.avg_purchase_price;
    let lastPrice = stockRecord.last_purchase_price;
    if (rate && rate > 0) {
      avgPrice = stockInternal.calculateAvgPrice(
        beforeQty,
        Number(stockRecord.avg_purchase_price || 0),
        quantity,
        rate
      );
      lastPrice = rate as any;
    }

    const updatedStock = await stockRepo.updateAvgPrice(stockRecord.id, avgPrice as any, lastPrice as any, company_id);
    await stockRepo.updateQuantity(stockRecord.id, afterQty, company_id);

    // Log movement
    await stockRepo.createMovement({
      company_id,
      product_id,
      batch_id: batch_id || null,
      branch_id: branch_id || null,
      reference_type: reference_type || null,
      reference_id: reference_id || null,
      movement_type: 'in',
      quantity,
      rate: rate || null,
      amount: rate ? quantity * rate : null,
      before_qty: beforeQty,
      after_qty: afterQty,
      notes: `Stock added via ${reference_type || 'manual'}`,
    } as StockMovementDTO);

    // Emit stock updated
    inventoryEvents.emit('stock.updated', {
      product_id,
      branch_id,
      before_qty: beforeQty,
      after_qty: afterQty,
      reference_type,
      reference_id,
    });

    return updatedStock;
  }

  // ─── PUBLIC API: getStockByProduct ───
  async getStockByProduct(product_id: string, company_id: string, branch_id?: string | null): Promise<stock_master[]> {
    return stockRepo.findByProduct(product_id, company_id, branch_id);
  }

  // ─── INTERNAL: adjustStock ───
  async adjustStock(input: StockAdjustmentInput, company_id: string, userId?: string): Promise<stock_master> {
    const stockRecord = await stockRepo.findOrCreate({
      company_id,
      product_id: input.product_id,
      branch_id: input.branch_id || null,
      batch_id: input.batch_id || null,
      quantity: 0,
    } as StockDTO);

    const beforeQty = Number(stockRecord.quantity);
    const afterQty = beforeQty + input.quantity; // quantity can be negative for reduction

    if (afterQty < 0) throw new Error('Adjustment would result in negative stock');

    const updatedStock = await stockRepo.updateQuantity(stockRecord.id, afterQty, company_id);

    await stockRepo.createMovement({
      company_id,
      product_id: input.product_id,
      batch_id: input.batch_id || null,
      branch_id: input.branch_id || null,
      reference_type: 'stock_adjustment',
      movement_type: input.quantity >= 0 ? 'addition' : 'reduction',
      quantity: Math.abs(input.quantity),
      rate: input.rate || null,
      before_qty: beforeQty,
      after_qty: afterQty,
      notes: `Adjustment: ${input.reason}`,
      created_by: userId || null,
    } as StockMovementDTO);

    inventoryEvents.emit('stock.updated', {
      product_id: input.product_id,
      branch_id: input.branch_id,
      before_qty: beforeQty,
      after_qty: afterQty,
      reference_type: 'stock_adjustment',
    });

    return updatedStock;
  }

  // ─── INTERNAL: transferStock ───
  async transferStock(input: StockTransferInput, company_id: string, userId?: string): Promise<{ from: stock_master; to: stock_master }> {
    // Deduct from source
    const fromStock = await this.deductStock(
      input.product_id,
      input.quantity,
      company_id,
      input.from_branch_id,
      input.batch_id || null,
      'stock_transfer',
      undefined
    );

    // Add to destination
    const toStock = await this.addStock(
      input.product_id,
      input.quantity,
      company_id,
      input.to_branch_id,
      input.batch_id || null,
      undefined,
      'stock_transfer',
      undefined
    );

    // Log transfer movement
    await stockRepo.createMovement({
      company_id,
      product_id: input.product_id,
      batch_id: input.batch_id || null,
      branch_id: input.to_branch_id,
      reference_type: 'stock_transfer',
      movement_type: 'transfer',
      quantity: input.quantity,
      before_qty: Number(fromStock.quantity),
      after_qty: Number(toStock.quantity),
      notes: `Transfer from ${input.from_branch_id} to ${input.to_branch_id}: ${input.notes || ''}`,
      created_by: userId || null,
    } as StockMovementDTO);

    return { from: fromStock, to: toStock };
  }

  // ─── INTERNAL: getStockMovements ───
  async getStockMovements(filter: MovementFilter, company_id: string): Promise<PaginatedResult<stock_movement>> {
    return stockRepo.findMovements(filter, company_id);
  }

  // ─── INTERNAL: getLowStock ───
  async getLowStock(company_id: string, branch_id?: string): Promise<any[]> {
    return productRepo.findLowStock(company_id, branch_id);
  }

  // ─── INTERNAL: getStock ───
  async getStock(filter: StockFilter, company_id: string): Promise<stock_master[]> {
    return stockRepo.findAll(filter, company_id);
  }
}