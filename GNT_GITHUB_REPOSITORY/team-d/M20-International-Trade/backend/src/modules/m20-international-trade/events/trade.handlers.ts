// GNT M20 — Event Consumers
// Owner: D4-DELTA

import { EventBus } from '../../../shared/events/event-bus';
import { TRADE_EVENTS, EventEnvelope } from './trade.events';
import { TradeEventPayload, FXRateUpdatedPayload, CustomsDutyCalculatedPayload } from '../types/trade.types';

// ── M10 Accounting Integration ──
async function handleTradeExportCreated(envelope: EventEnvelope<TradeEventPayload>) {
  console.log('[M20→M10] Export created, triggering ledger entry', envelope.payload);
  // await M10 accounting.service.createLedgerEntry({ ... });
}

async function handleTradeImportCreated(envelope: EventEnvelope<TradeEventPayload>) {
  console.log('[M20→M10] Import created, triggering ledger entry', envelope.payload);
  // await M10 accounting.service.createLedgerEntry({ ... });
}

// ── M16 Notification Integration ──
async function handleTradeCreatedNotification(envelope: EventEnvelope<TradeEventPayload>) {
  console.log('[M20→M16] Sending trade notification', envelope.payload);
  // await M16 notification.service.send({ ... });
}

// ── M09 GST Update ──
async function handleHSNClassified(envelope: EventEnvelope<any>) {
  console.log('[M20→M09] HSN classified, updating GST records', envelope.payload);
  // await M09 gst.service.updateHSNMapping({ ... });
}

// ── M17 Reporting ──
async function handleFXRateUpdated(envelope: EventEnvelope<FXRateUpdatedPayload>) {
  console.log('[M20→M17] FX rate updated for reporting', envelope.payload);
  // await M17 reporting.service.logFXRate({ ... });
}

// ── M11 Payment Trigger ──
async function handleCustomsDutyCalculated(envelope: EventEnvelope<CustomsDutyCalculatedPayload>) {
  console.log('[M20→M11] Customs duty calculated, triggering payment', envelope.payload);
  // await M11 payment.service.createPayment({ ... });
}

// ── Register all handlers ──
export function registerTradeEventHandlers(eventBus: EventBus) {
  eventBus.subscribe(TRADE_EVENTS.TRADE_EXPORT_CREATED, handleTradeExportCreated);
  eventBus.subscribe(TRADE_EVENTS.TRADE_IMPORT_CREATED, handleTradeImportCreated);
  eventBus.subscribe(TRADE_EVENTS.HSN_CLASSIFIED, handleHSNClassified);
  eventBus.subscribe(TRADE_EVENTS.FX_RATE_UPDATED, handleFXRateUpdated);
  eventBus.subscribe(TRADE_EVENTS.CUSTOMS_DUTY_CALCULATED, handleCustomsDutyCalculated);

  // Notification handler for both import/export
  eventBus.subscribe(TRADE_EVENTS.TRADE_EXPORT_CREATED, handleTradeCreatedNotification);
  eventBus.subscribe(TRADE_EVENTS.TRADE_IMPORT_CREATED, handleTradeCreatedNotification);
}
