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
  /** insaan ke padhne layak wajah — hindi mein */
  reasons: string[];
  /** GNT fields mein badla hua roop */
  mapped: Record<string, unknown>;
}

/** Poori file ka nateeja — yahi preview banata hai */
export interface AnalyzeResult {
  companyId: string;
  sheetName: string;
  sense: SenseResult;
  totals: { rows: number; green: number; orange: number; red: number };
  verdicts: RowVerdict[];
  /** in-file duplicate जोड़े (row numbers) */
  duplicateGroups: number[][];
  /** kya yeh file bina sudhaar ke import ho sakti hai */
  importable: boolean;
}
