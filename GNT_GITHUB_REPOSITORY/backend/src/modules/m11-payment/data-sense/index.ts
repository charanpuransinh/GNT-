/**
 * Data Sense — Client Data Intake & Migration  (M11 के अंदर, sub-module)
 *
 * इतिहास: यह पहले अलग module "M21" था। मालिक के फ़ैसले (2026-09-08) से M21 को
 * हटाकर इसका पूरा pipeline M11 (Payment) के नीचे ला दिया गया — क्योंकि इसका
 * एकमात्र अधूरा हिस्सा "बैंक में आई रक़म → पुराने बिल FIFO चुकता" था, जो M11 का
 * काम है (owner का फ़ैसला #3, Option B)।
 *
 * यह क्या करता है:  ग्राहक की पुरानी फाइल (Tally/Vyapar/Marg/Excel/CSV) पढ़ना →
 *                    समझना (Data Sense) → GNT के fields से मिलाना → जाँचना →
 *                    duplicate देखना → preview → मंज़ूरी → **सही module को सौंप देना**।
 *
 * यह किसी master का मालिक नहीं बनता — सिर्फ़ SENSE → MAP → VALIDATE → TRANSFER:
 *   Party→M05 · Item/Stock→M06 · Purchase→M07 · Sales→M08 · GST→M09 ·
 *   Accounting→M10 · Bank-receipt→M10 (direct-ledger, default) या M11 (FIFO settle) ·
 *   Export→M20 · Scheme/Rate→M08
 *
 * स्थिति (2026-09-08, Claude): SENSE → MAP → VALIDATE → PREVIEW **चालू**,
 *   TRANSFER भी **चालू** — बैंक-receipt के दोनों रास्ते (owner फ़ैसला #3):
 *     • `direct-ledger-credit` (default) → M10 में party ledger credit
 *     • `fifo-invoice-settlement`        → M11 में पुराने open invoice क्रम से चुकता
 */

/** इस sub-module का API namespace (M11 router के नीचे) */
export const DATA_SENSE_API_BASE = '/api/v1/payments/data-sense' as const;

// DataGroup / DataSenseStatus / DATA_GROUP_OWNER — types/dataGroup.ts se
// (index barrel से internal import circular dependency ban jata tha)
export { DATA_GROUP_OWNER, type DataGroup, type DataSenseStatus } from './types/dataGroup';

// ── PUBLIC सतह (दूसरे module सिर्फ़ यही इस्तेमाल करें) ──
export { dataSenseRoutes, default as router } from './routes/dataSense.routes';
export { dataSenseService, DataSenseService } from './services/dataSense.service';
export { senseSheet, mapRow, GROUP_SPECS } from './services/sense.engine';
export { validateRow, findDuplicates } from './services/validate.engine';
export { buildTransferPlan } from './services/transfer.planner';
export { executeTransfer } from './services/transfer.executor';
export { DEFAULT_OPTIONS } from './types/dataSense.types';
export type {
  AnalyzeResult,
  ColumnMapping,
  DataSenseOptions,
  IntakeSheet,
  RowVerdict,
  RowZone,
  SenseResult,
  TransferPlanItem,
} from './types/dataSense.types';
