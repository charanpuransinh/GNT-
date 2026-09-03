/**
 * M21 — Client Data Sense: types
 *
 * Grahak ki purani file (Tally/Vyapar/Marg/Excel/CSV) ki har पंक्ति ka safar:
 *   SENSE (yeh kis cheez ka data hai?) → MAP (kaunsa column GNT ke kis field se milta hai?)
 *   → VALIDATE (GREEN/ORANGE/RED) → PREVIEW → (मंज़ूरी ke baad) TRANSFER
 *
 * Yeh module kisi master ka malik nahi banta — sirf samajhta, jaanchta aur saunpta hai.
 */
import type { DataGroup, DataSenseStatus } from '../index';

/**
 * मालिक के 3 फ़ैसले (2026-09-03) — यही engine का बर्ताव तय करते हैं।
 * UI में हर toggle इन्हीं को बदलता है; भेजा न जाए तो नीचे वाले default लगते हैं।
 */
export interface DataSenseOptions {
  /**
   * फ़ैसला 1 — दोहरी पंक्तियाँ: **Option C (Review Zone / सख़्त निशान)**।
   * न अपने-आप जुड़ेंगी, न अपने-आप चढ़ेंगी — इंसान देखेगा तभी आगे।
   */
  duplicatePolicy: 'review-zone';
  /**
   * फ़ैसला 2 — बिना GSTIN वाली पार्टी:
   *  - `b2c-auto-create` (default, Option A) — B2C मानकर बना दो
   *  - `suspense-zone` (Option B) — रोक कर suspense में डालो
   */
  nonGstinParty: 'b2c-auto-create' | 'suspense-zone';
  /**
   * फ़ैसला 3 — बैंक मिलान:
   *  - `direct-ledger-credit` (default, Option A) — सीधे पार्टी के खाते में जमा (M10)
   *  - `fifo-invoice-settlement` (Option B) — पुराने बिल से क्रम में चुकता (M11)
   */
  bankReconciliation: 'direct-ledger-credit' | 'fifo-invoice-settlement';
}

/** मालिक के तय किए हुए defaults */
export const DEFAULT_OPTIONS: DataSenseOptions = {
  duplicatePolicy: 'review-zone',
  nonGstinParty: 'b2c-auto-create',
  bankReconciliation: 'direct-ledger-credit',
};

/** एक पंक्ति किस कमरे में गई */
export type RowZone = 'ready' | 'review' | 'suspense' | 'blocked';

/** मंज़ूरी के बाद यह पंक्ति कहाँ और कैसे जाएगी */
export interface TransferPlanItem {
  rowNumber: number;
  /** किस module को सौंपी जाएगी */
  targetModule: string;
  /** वहाँ क्या किया जाएगा */
  operation: 'create' | 'credit-ledger' | 'settle-invoices-fifo' | 'hold-for-review';
  payload: Record<string, unknown>;
  note?: string;
}

/** Grahak ki file jaisi aayi — headers + kachchi पंक्तियाँ */
export interface IntakeSheet {
  /** file/sheet ka naam — sirf report mein dikhane ke liye */
  sheetName?: string;
  headers: string[];
  rows: Array<Record<string, unknown>>;
}

/** Ek column ke baare mein faisla */
export interface ColumnMapping {
  /** grahak ki file ka column */
  sourceColumn: string;
  /** GNT ka field (null = samajh nahi aaya) */
  targetField: string | null;
  /** 0..1 — kitna bharosa hai is jodi par */
  confidence: number;
  /** kis aadhaar par mila: naam se, namune (sample) se, ya nahi mila */
  basis: 'exact-name' | 'alias' | 'pattern' | 'unmatched';
}

/** Poori sheet par SENSE ka nateeja */
export interface SenseResult {
  group: DataGroup | null;
  /** 0..1 — group pehchanne ka bharosa */
  confidence: number;
  /** kis module ko jayega (DATA_GROUP_OWNER se) */
  ownerModule: string | null;
  mappings: ColumnMapping[];
  /** jo columns samajh nahi aaye */
  unmatchedColumns: string[];
  /** jo zaroori field file mein mile hi nahi */
  missingRequiredFields: string[];
}

/** Ek पंक्ति ki jaanch ka nateeja */
export interface RowVerdict {
  /** file mein पंक्ति ka number (1 se, header ko chhodkar) */
  rowNumber: number;
  status: DataSenseStatus;
  /** कौन से कमरे में गई — ready / review / suspense / blocked */
  zone: RowZone;
  /** insaan ke padhne layak wajah — hindi mein */
  reasons: string[];
  /** GNT fields mein badla hua roop */
  mapped: Record<string, unknown>;
}

/** Poori file ka nateeja — yahi preview banata hai */
export interface AnalyzeResult {
  companyId: string;
  sheetName: string;
  /** इस चलन में कौन से नियम लगे (मालिक के 3 फ़ैसले) */
  options: DataSenseOptions;
  sense: SenseResult;
  totals: { rows: number; green: number; orange: number; red: number };
  verdicts: RowVerdict[];
  /** in-file duplicate जोड़े (row numbers) */
  duplicateGroups: number[][];
  /** फ़ैसला 1 — इंसान की नज़र चाहिए (दोहरी पंक्तियाँ) */
  reviewZone: number[];
  /** फ़ैसला 2(B) — बिना GSTIN, रोकी गई पंक्तियाँ */
  suspenseZone: number[];
  /** मंज़ूरी के बाद क्या-कहाँ जाएगा */
  transferPlan: TransferPlanItem[];
  /** kya yeh file bina sudhaar ke import ho sakti hai */
  importable: boolean;
}
