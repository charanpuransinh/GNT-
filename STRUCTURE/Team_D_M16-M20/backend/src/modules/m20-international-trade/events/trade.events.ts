// GNT M20 — Event Definitions
// Owner: D4-DELTA

export const TRADE_EVENTS = {
  // Published by M20
  TRADE_EXPORT_CREATED: 'trade.export.created',
  TRADE_IMPORT_CREATED: 'trade.import.created',
  HSN_CLASSIFIED: 'hsn.classified',
  FX_RATE_UPDATED: 'fx.rate.updated',
  CUSTOMS_DUTY_CALCULATED: 'customs.duty.calculated',
} as const;

export type TradeEventType = (typeof TRADE_EVENTS)[keyof typeof TRADE_EVENTS];

export interface EventEnvelope<T = unknown> {
  eventType: TradeEventType;
  payload: T;
  metadata: {
    traceId: string;
    timestamp: string;
    sourceModule: string;
    version: string;
  };
}

export function createEventEnvelope<T>(
  eventType: TradeEventType,
  payload: T,
  traceId: string
): EventEnvelope<T> {
  return {
    eventType,
    payload,
    metadata: {
      traceId,
      timestamp: new Date().toISOString(),
      sourceModule: 'M20',
      version: '2.0',
    },
  };
}
