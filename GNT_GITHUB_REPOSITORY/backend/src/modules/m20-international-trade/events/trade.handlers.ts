// GNT M20 — Event Consumers
// Owner: D4-DELTA

import { EventBus } from '../../../shared/events/event-bus';
import { TRADE_EVENTS } from './trade.events';
import { TradeEventPayload, FXRateUpdatedPayload, CustomsDutyCalculatedPayload } from '../types/trade.types';
import { notificationService } from '../../m16-notification';

// नोट: असली publishers (trade.service.ts, hsn.service.ts, fx.service.ts,
// customs.service.ts) `eventBus.publish(eventName, payload)` को कच्चा payload
// भेजते हैं — `createEventEnvelope()`/`EventEnvelope<T>` कहीं इस्तेमाल ही नहीं
// होता। पुराने handlers `envelope.payload` की उम्मीद रखते थे (हमेशा undefined
// रहता — बस console.log होने की वजह से कभी असर नहीं दिखा)। असली payload direct है।

// ── M16 Notification Integration (real: resolves company admins, persists + routes) ──
async function handleTradeCreatedNotification(payload: TradeEventPayload) {
  const { company_id, trade_job_id, reference_no, type } = payload;
  const eventName = type === 'export' ? TRADE_EVENTS.TRADE_EXPORT_CREATED : TRADE_EVENTS.TRADE_IMPORT_CREATED;
  try {
    await notificationService.handleEventNotification({
      eventName,
      payload: { trade_job_id, reference_no, type },
      companyId: company_id,
    });
  } catch (e) {
    // notification भेजना असली shipment create होने को कभी block नहीं करना चाहिए
    console.error(`[M20→M16] notification failed for trade job ${trade_job_id}:`, e);
  }
}

// ── M10 Accounting Integration ──
// TradeEventPayload में कोई राशि (amount) नहीं है — shipment बनना अपने आप में
// accounting event नहीं (असली double-entry posting M08/M07 invoice post पर
// M10.InvoiceLedgerService से पहले से होती है)। यहाँ ledger entry गढ़ना (fabricate
// करना) ग़लत होगा — इसलिए जान-बूझकर no-op, सिर्फ़ audit के लिए log।
// (M19 का global subscriber हर published event को वैसे भी audit_log में डाल देता है।)
async function handleTradeExportCreated(payload: TradeEventPayload) {
  console.log('[M20→M10] Export shipment created (no monetary posting — see comment)', payload);
}

async function handleTradeImportCreated(payload: TradeEventPayload) {
  console.log('[M20→M10] Import shipment created (no monetary posting — see comment)', payload);
}

// ── M09 GST Update ──
// hsn.service.validateHSN() से payload में company_id नहीं आता (सिर्फ़ HSN के
// rates), और m09-gst/services/gst.service.ts में कोई write/update method है ही
// नहीं (सिर्फ़ getGSTR1/getGSTR3B/reconcileGSTR2B — read-only)। बिना owner के
// नया M09 API बनाए यहाँ से "update" करना गढ़ना होगा — इसलिए log-only रखा है।
async function handleHSNClassified(payload: unknown) {
  console.log('[M20→M09] HSN classified (no M09 write API exists yet)', payload);
}

// ── M17 Reporting ──
// FXRateUpdatedPayload में पूरा data है (company_id/currencies/rate), पर
// m17-reporting में FX-rate ingest करने वाला कोई public method नहीं है।
// नया API बिना owner-spec के जोड़ना architecture गढ़ना होगा — log-only।
async function handleFXRateUpdated(payload: FXRateUpdatedPayload) {
  console.log('[M20→M17] FX rate updated (no M17 ingestion API exists yet)', payload);
}

// ── M11 Payment Trigger ──
// Customs duty सिर्फ़ किसी असली trade_job से जुड़ा हो तभी publish होता है
// (customs.service.ts अब ad-hoc preview पर publish नहीं करता)। फिर भी असली
// payment बनाने के लिए paymentMethodId + party (customs authority vendor)
// चाहिए — दोनों payload में नहीं हैं और न M20/M11 में कहीं तय हैं। बिना owner
// के तय किए payment method/party गढ़ना ग़लत payment बना देगा — इसलिए log-only,
// असली payment अभी भी manual AP flow से बनता है।
async function handleCustomsDutyCalculated(payload: CustomsDutyCalculatedPayload) {
  console.log('[M20→M11] Customs duty calculated (no payment-method/party mapping decided — see comment)', payload);
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
