/**
 * M21 — VALIDATE engine (शुद्ध logic, कोई database नहीं)
 *
 * हर पंक्ति को तीन में से एक रंग मिलता है (spec §20):
 *   GREEN  = जैसी है वैसी चढ़ सकती है
 *   ORANGE = चढ़ सकती है पर इंसान देख ले (शक़ है — duplicate, अधूरा वैकल्पिक field)
 *   RED    = नहीं चढ़ेगी (ज़रूरी field ग़ायब या ग़लत)
 *
 * नियम भारत के हिसाब से: GSTIN 15 अंकों का ढाँचा, HSN 4/6/8 अंक, रक़म संख्या हो,
 * तारीख़ पढ़ी जा सके।
 */
import type { DataGroup, DataSenseStatus } from '../index';
import { GROUP_SPECS } from './sense.engine';
import type { RowVerdict } from '../types/dataSense.types';

/** भारत का GSTIN: 2 अंक राज्य + 10 अंक PAN + 1 इकाई + Z + 1 checksum */
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const HSN_RE = /^[0-9]{4}([0-9]{2}([0-9]{2})?)?$/;
const PHONE_RE = /^[0-9]{10}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isBlank = (v: unknown): boolean => v === undefined || v === null || String(v).trim() === '';

const isNumeric = (v: unknown): boolean => {
  if (isBlank(v)) return false;
  const n = Number(String(v).replace(/[,\s₹]/g, ''));
  return Number.isFinite(n);
};

const isDate = (v: unknown): boolean => {
  if (isBlank(v)) return false;
  const s = String(v).trim();
  // dd/mm/yyyy और dd-mm-yyyy — भारत में यही सबसे आम
  const dmy = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/.exec(s);
  if (dmy) {
    const d = Number(dmy[1]);
    const m = Number(dmy[2]);
    return d >= 1 && d <= 31 && m >= 1 && m <= 12;
  }
  return !Number.isNaN(Date.parse(s));
};

/** एक पंक्ति की जाँच */
export function validateRow(
  mapped: Record<string, unknown>,
  group: DataGroup,
  rowNumber: number,
): RowVerdict {
  const reasons: string[] = [];
  let status: DataSenseStatus = 'GREEN';

  const red = (msg: string) => { reasons.push(msg); status = 'RED'; };
  const orange = (msg: string) => { reasons.push(msg); if (status !== 'RED') status = 'ORANGE'; };

  // 1) ज़रूरी fields
  for (const field of GROUP_SPECS[group].required) {
    if (isBlank(mapped[field])) red(`ज़रूरी field "${field}" ख़ाली है`);
  }

  // 2) GSTIN
  if (!isBlank(mapped.gstin)) {
    const gstin = String(mapped.gstin).trim().toUpperCase();
    if (!GSTIN_RE.test(gstin)) red(`GSTIN का ढाँचा ग़लत है: "${gstin}"`);
    else mapped.gstin = gstin;
  } else if (group === 'party') {
    orange('GSTIN नहीं है — B2C पार्टी मानी जाएगी');
  }

  // 3) HSN
  if (!isBlank(mapped.hsn)) {
    const hsn = String(mapped.hsn).trim();
    if (!HSN_RE.test(hsn)) red(`HSN 4/6/8 अंकों का होना चाहिए: "${hsn}"`);
  }

  // 4) रक़म वाले fields
  for (const field of ['rate', 'purchaseRate', 'taxableValue', 'gstAmount', 'invoiceTotal', 'openingBalance', 'openingStock', 'debit', 'credit', 'fobValue', 'discountPercent']) {
    if (!isBlank(mapped[field]) && !isNumeric(mapped[field])) {
      red(`"${field}" में संख्या होनी चाहिए, मिला: "${String(mapped[field])}"`);
    }
  }

  // 5) तारीख़ वाले fields
  for (const field of ['invoiceDate', 'voucherDate', 'validFrom', 'validTo']) {
    if (!isBlank(mapped[field]) && !isDate(mapped[field])) {
      red(`"${field}" की तारीख़ पढ़ी नहीं जा सकी: "${String(mapped[field])}"`);
    }
  }

  // 6) सम्पर्क — ग़लत हो तो रोकना नहीं, पर बताना ज़रूरी
  if (!isBlank(mapped.phone) && !PHONE_RE.test(String(mapped.phone).replace(/\D/g, '').slice(-10))) {
    orange(`फ़ोन नंबर 10 अंकों का नहीं लगता: "${String(mapped.phone)}"`);
  }
  if (!isBlank(mapped.email) && !EMAIL_RE.test(String(mapped.email).trim())) {
    orange(`ईमेल का ढाँचा ठीक नहीं: "${String(mapped.email)}"`);
  }

  // 7) बही-खाता का नियम: debit और credit दोनों एक साथ नहीं
  if (group === 'accounting' && !isBlank(mapped.debit) && !isBlank(mapped.credit)) {
    const d = Number(String(mapped.debit).replace(/[,\s₹]/g, ''));
    const c = Number(String(mapped.credit).replace(/[,\s₹]/g, ''));
    if (d > 0 && c > 0) red('एक ही पंक्ति में debit और credit दोनों हैं');
  }

  // 8) बिक्री/ख़रीद का जोड़ मिलान (सहनशीलता ₹1 — rounding के लिए)
  if ((group === 'sales' || group === 'purchase') && isNumeric(mapped.taxableValue) && isNumeric(mapped.gstAmount) && isNumeric(mapped.invoiceTotal)) {
    const t = Number(String(mapped.taxableValue).replace(/[,\s₹]/g, ''));
    const g = Number(String(mapped.gstAmount).replace(/[,\s₹]/g, ''));
    const total = Number(String(mapped.invoiceTotal).replace(/[,\s₹]/g, ''));
    if (Math.abs(t + g - total) > 1) {
      orange(`जोड़ नहीं मिल रहा: ${t} + ${g} ≠ ${total}`);
    }
  }

  return { rowNumber, status, reasons, mapped };
}

/** फ़ाइल के अंदर ही दोहरी पंक्तियाँ ढूँढो (GSTIN → नाम+फ़ोन → invoice no) */
export function findDuplicates(verdicts: RowVerdict[], group: DataGroup): number[][] {
  const keyOf = (m: Record<string, unknown>): string | null => {
    if (group === 'party') {
      if (!isBlank(m.gstin)) return `gstin:${String(m.gstin).toUpperCase()}`;
      if (!isBlank(m.name)) return `name:${String(m.name).toLowerCase().trim()}|${String(m.phone ?? '').replace(/\D/g, '')}`;
      return null;
    }
    if (group === 'item') {
      if (!isBlank(m.sku)) return `sku:${String(m.sku).toLowerCase().trim()}`;
      if (!isBlank(m.name)) return `name:${String(m.name).toLowerCase().trim()}`;
      return null;
    }
    if (group === 'sales' || group === 'purchase' || group === 'export') {
      if (!isBlank(m.invoiceNo)) return `inv:${String(m.invoiceNo).toLowerCase().trim()}`;
      return null;
    }
    return null;
  };

  const buckets = new Map<string, number[]>();
  for (const v of verdicts) {
    const key = keyOf(v.mapped);
    if (!key) continue;
    const list = buckets.get(key) ?? [];
    list.push(v.rowNumber);
    buckets.set(key, list);
  }

  const groups = [...buckets.values()].filter((rows) => rows.length > 1);

  // duplicate मिली पंक्तियों को ORANGE कर दो — चढ़ेंगी, पर इंसान देख ले
  const dupRows = new Set(groups.flat());
  for (const v of verdicts) {
    if (dupRows.has(v.rowNumber) && v.status === 'GREEN') {
      v.status = 'ORANGE';
      v.reasons.push('इसी फ़ाइल में यह पंक्ति दोहरी है');
    }
  }

  return groups;
}
