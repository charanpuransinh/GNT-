// Public module exports (टास्क #016 — public contract)
// services/types/validators/routes ही — repositories कभी नहीं (blueprint rule)
export { PurchaseService } from './services/purchase.service';
export { PurchaseOrderService } from './services/po.service';
export { PurchaseController } from './controllers/purchase.controller';
export { PurchaseOrderController } from './controllers/purchase-order.controller';
export { createPurchaseRouter } from './routes/purchase.routes';
export * from './types/purchase.types';
export * from './validators/purchase.schema';
