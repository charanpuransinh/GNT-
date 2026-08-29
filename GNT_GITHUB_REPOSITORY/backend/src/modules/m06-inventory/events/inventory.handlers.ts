// GNT M06 — Inventory Event Handlers
import { inventoryEvents } from '../services/stock.service';
import { StockInternalService } from '../services/stock.internal';
import {
  StockUpdatedEvent,
  StockLowEvent,
  BatchExpiringEvent,
  EVENT_NAMES,
} from './inventory.events';

const stockInternal = new StockInternalService();

export class InventoryEventHandlers {
  constructor() {
    this.registerHandlers();
  }

  registerHandlers() {
    inventoryEvents.on(EVENT_NAMES.STOCK_UPDATED, this.handleStockUpdated.bind(this));
    inventoryEvents.on(EVENT_NAMES.STOCK_LOW, this.handleStockLow.bind(this));
  }

  private handleStockUpdated(event: StockUpdatedEvent) {
    console.log(`[STOCK UPDATED] Product: ${event.product_id} | ${event.before_qty} → ${event.after_qty}`);
    // Audit logging, cache invalidation, etc.
  }

  private handleStockLow(event: StockLowEvent) {
    console.log(`[STOCK LOW] Product: ${event.product_name} (${event.product_id}) | Current: ${event.current_qty} | Reorder: ${event.reorder_level}`);
    // Trigger notifications to M16, auto-PO draft to M13
    // This would publish to message bus in production
  }

  async checkBatchExpiry(company_id: string) {
    const expiringBatches = await stockInternal.getExpiringBatches(company_id, 30);
    for (const batch of expiringBatches) {
      const daysRemaining = Math.ceil(
        (new Date(batch.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      const event: BatchExpiringEvent = {
        batch_id: batch.id,
        product_id: batch.product_id,
        expiry_date: batch.expiry_date,
        days_remaining: daysRemaining,
        product_name: batch.product?.name,
        timestamp: new Date(),
      };
      console.log(`[BATCH EXPIRING] ${event.product_name} | Batch: ${batch.batch_number} | Expires in ${daysRemaining} days`);
      // Publish to message bus
    }
  }
}

// Auto-init handlers
export const inventoryEventHandlers = new InventoryEventHandlers();
