// GNT M06 — Inventory Event Handlers
import { inventoryEvents } from '../services/stock.service';
import { StockInternalService } from '../services/stock.internal';
import { eventBus } from '@/common/events/event-bus';
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
    // साझा event bus पर भी — blueprint §7.13: M13 EVENT-triggered rules इसी से चलते हैं
    void eventBus.publish(EVENT_NAMES.STOCK_UPDATED, event);
  }

  private handleStockLow(event: StockLowEvent) {
    console.log(`[STOCK LOW] Product: ${event.product_name} (${event.product_id}) | Current: ${event.current_qty} | Reorder: ${event.reorder_level}`);
    // पहले सिर्फ़ log होता था — कमेंट में लिखा था "M13 को publish करेंगे" पर होता नहीं था।
    // अब साझा event bus पर, ताकि M13 के EVENT-trigger rules (blueprint: M13 USES M06) असल में चलें।
    void eventBus.publish(EVENT_NAMES.STOCK_LOW, event);
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
