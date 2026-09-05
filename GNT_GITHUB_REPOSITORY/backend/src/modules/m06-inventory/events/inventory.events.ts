// GNT M06 — Inventory Event Definitions
export interface StockUpdatedEvent {
  company_id: string;
  product_id: string;
  branch_id?: string | null;
  before_qty: number;
  after_qty: number;
  reference_type?: string | null;
  reference_id?: string | null;
  timestamp: Date;
}

// company_id ज़रूरी है — बिना इसके M13 (blueprint §7.13, "USES M06") tenant तय नहीं
// कर पाता और सारी companies के event-rules इस पर चल जाते, चाहे stock किसी और की हो।
export interface StockLowEvent {
  company_id: string;
  product_id: string;
  branch_id?: string | null;
  current_qty: number;
  reorder_level: number | null;
  product_name?: string | null;
  timestamp: Date;
}

export interface BatchExpiringEvent {
  batch_id: string;
  product_id: string;
  expiry_date: Date;
  days_remaining: number;
  product_name?: string | null;
  timestamp: Date;
}

export const EVENT_NAMES = {
  STOCK_UPDATED: 'stock.updated',
  STOCK_LOW: 'stock.low',
  BATCH_EXPIRING: 'batch.expiring',
} as const;
