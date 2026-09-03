/**
 * M21 — Client Data Sense / Universal Data Intake & Migration
 * (ROUGH SCAFFOLDING — समीक्षक AI, 2026-09-02)
 *
 * मालिक के "GNT M20 & M21 Master Update Specification" के अनुसार बनाया गया ढाँचा।
 *
 * यह module क्या है:  ग्राहक की पुरानी फाइल (Tally/Vyapar/Marg/Excel/CSV) पढ़ना →
 *                     समझना (Data Sense) → GNT के fields से मिलाना → जाँचना →
 *                     duplicate देखना → preview → मंज़ूरी → **सही module को सौंप देना**।
 *
 * यह module क्या नहीं है (spec §21, §35 — सख़्त मनाही):
 *   ❌ payment engine        ❌ bank reconciliation engine
 *   ❌ receipt engine        ❌ कोई दूसरा accounting database
 *   ये सब मौजूदा Accounts (M10) / Payment (M11) के ही रहेंगे।
 *
 * यह किसी master का मालिक नहीं बनता — सिर्फ़ SENSE → MAP → VALIDATE → TRANSFER:
 *   Party→M05 · Item/Stock→M06 · Purchase→M07 · Sales→M08 · GST→M09 ·
 *   Accounting→M10 · Payment/Bank→M11 · Export→M20 · Scheme/Rate→M08
 *
 * स्थिति (2026-09-03, Claude): SENSE → MAP → VALIDATE → PREVIEW **चालू है**
 *   (`POST /api/v1/data-sense/analyze`) — बिना database के, शुद्ध logic।
 *   ⏳ TRANSFER (असल में M05/M06/M08… में डालना) अभी नहीं — उसके लिए owner के
 *      बाक़ी 3 फ़ैसले चाहिए (`tips/reviewer-ai/SPEC-REVIEW-M20-M21.md`)।
 */

/** इस module का API namespace (spec §32) */
export const M21_API_BASE = '/api/v1/data-sense' as const;

/** हर सेंसी हुई पंक्ति का नतीजा — GNT की audit परंपरा (spec §20) */
export type DataSenseStatus = 'GREEN' | 'ORANGE' | 'RED';

/** ग्राहक की फाइल से पहचाने जाने वाले समूह (spec §15) */
export type DataGroup =
  | 'party' | 'item' | 'sales' | 'purchase' | 'accounting' | 'export' | 'scheme';

/** कौन सा समूह किस module का है — यही routing की तालिका है (spec §16) */
export const DATA_GROUP_OWNER: Readonly<Record<DataGroup, string>> = {
  party: 'm05-party-management',
  item: 'm06-inventory',
  purchase: 'm07-purchase',
  sales: 'm08-sales',
  accounting: 'm10-accounting',
  export: 'm20-international-trade',
  scheme: 'm08-sales',
} as const;

// ── PUBLIC सतह (दूसरे module सिर्फ़ यही इस्तेमाल करें) ──
export { dataSenseRoutes, default as router } from './routes/dataSense.routes';
export { dataSenseService, DataSenseService } from './services/dataSense.service';
export { senseSheet, mapRow, GROUP_SPECS } from './services/sense.engine';
export { validateRow, findDuplicates } from './services/validate.engine';
export { buildTransferPlan } from './services/transfer.planner';
export { DEFAULT_OPTIONS } from './types/dataSense.types';
export type {
  AnalyzeResult, ColumnMapping, DataSenseOptions, IntakeSheet, RowVerdict,
  RowZone, SenseResult, TransferPlanItem,
} from './types/dataSense.types';
