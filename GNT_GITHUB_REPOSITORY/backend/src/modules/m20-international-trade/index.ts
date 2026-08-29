// GNT M20 — Public Exports
// Owner: D4-DELTA

// Services (PUBLIC — consumed by other modules)
export { TradeService, CreateExportShipmentInput, CreateImportShipmentInput } from './services/trade.service';
export { HSNService } from './services/hsn.service';
export { FXService } from './services/fx.service';
export { CustomsService } from './services/customs.service';
export { TradeDocumentService } from './services/trade-document.service';

// Types (PUBLIC)
export * from './types/trade.types';

// Validators (PUBLIC)
export * from './validators/trade.schema';

// Events (PUBLIC)
export { TRADE_EVENTS, createEventEnvelope } from './events/trade.events';
export { registerTradeEventHandlers } from './events/trade.handlers';

// Routes
export { default as tradeRoutes } from './routes/trade.routes';

// Note: Repositories are NOT exported — they are OWNER ONLY
// Note: Models are NOT exported — they are internal Prisma extensions
