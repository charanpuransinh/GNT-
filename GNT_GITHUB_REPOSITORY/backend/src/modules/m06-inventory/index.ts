// GNT M06 — Backend Module Index
// टास्क #016: public contract — services/types/validators/routes ही; repositories कभी नहीं (blueprint rule)
export { ProductService } from './services/product.service';
export { StockService, inventoryEvents } from './services/stock.service';
export { CategoryService } from './services/category.service';
export { StockInternalService } from './services/stock.internal';
export { ProductController } from './controllers/product.controller';
export { StockController } from './controllers/stock.controller';
export { CategoryController } from './controllers/category.controller';
export { inventoryEventHandlers } from './events/inventory.handlers';
export * from './types/inventory.types';
export * from './validators/inventory.schema';
export { default as inventoryRoutes } from './routes/inventory.routes';
export { InventoryService, inventoryService } from './services/inventory.service';
