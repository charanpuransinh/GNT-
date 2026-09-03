/**
 * M21 — TRANSFER planner
 *
 * मंज़ूरी के बाद हर पंक्ति कहाँ और कैसे जाएगी, यह तय करता है।
 * (असल में डालने का काम उस module का है — M21 किसी master का मालिक नहीं बनता, spec §21/§35।)
 *
 * मालिक के फ़ैसले (2026-09-03) यहीं लगते हैं:
 *   1. दोहरी पंक्ति  → Review Zone में रुकेगी (`hold-for-review`), कभी अपने-आप नहीं चढ़ेगी
 *   2. बिना GSTIN   → default: B2C बनाकर M05 को; toggle: suspense में रुकेगी
 *   3. बैंक मिलान   → default: सीधे पार्टी खाते में जमा (M10);
 *                      toggle: पुराने बिल से क्रम में चुकता — FIFO (M11)
 */
import { DATA_GROUP_OWNER, type DataGroup } from '../index';
import type { DataSenseOptions, RowVerdict, TransferPlanItem } from '../types/dataSense.types';

/** बैंक/भुगतान वाली पंक्ति है? (accounting sheet में जमा राशि) */
function isBankReceiptRow(group: DataGroup, mapped: Record<string, unknown>): boolean {
  if (group !== 'accounting') return false;
  const credit = mapped.credit;
  if (credit === undefined || credit === null || String(credit).trim() === '') return false;
  return Number(String(credit).replace(/[,\s₹]/g, '')) > 0;
}

export function buildTransferPlan(
  verdicts: RowVerdict[],
  group: DataGroup,
  options: DataSenseOptions,
): TransferPlanItem[] {
  const owner = DATA_GROUP_OWNER[group];

  return verdicts.map((v): TransferPlanItem => {
    // RED — कहीं नहीं जाएगी
    if (v.status === 'RED') {
      return {
        rowNumber: v.rowNumber,
        targetModule: owner,
        operation: 'hold-for-review',
        payload: v.mapped,
        note: 'ग़लती है — सुधारे बिना नहीं चढ़ेगी',
      };
    }

    // फ़ैसला 1 — दोहरी पंक्ति हमेशा रुकेगी
    if (v.zone === 'review') {
      return {
        rowNumber: v.rowNumber,
        targetModule: owner,
        operation: 'hold-for-review',
        payload: v.mapped,
        note: 'Review Zone (फ़ैसला 1) — इंसान की मंज़ूरी के बाद ही आगे',
      };
    }

    // फ़ैसला 2(B) — बिना GSTIN वाली पार्टी suspense में
    if (v.zone === 'suspense') {
      return {
        rowNumber: v.rowNumber,
        targetModule: owner,
        operation: 'hold-for-review',
        payload: v.mapped,
        note: 'Suspense Zone (फ़ैसला 2, Option B) — GSTIN के बिना रोकी गई',
      };
    }

    // फ़ैसला 3 — बैंक में आई रक़म
    if (isBankReceiptRow(group, v.mapped)) {
      return options.bankReconciliation === 'fifo-invoice-settlement'
        ? {
            rowNumber: v.rowNumber,
            targetModule: 'm11-payment',
            operation: 'settle-invoices-fifo',
            payload: v.mapped,
            note: 'फ़ैसला 3 (Option B) — पुराने बिल से क्रम में चुकता',
          }
        : {
            rowNumber: v.rowNumber,
            targetModule: 'm10-accounting',
            operation: 'credit-ledger',
            payload: v.mapped,
            note: 'फ़ैसला 3 (default, Option A) — सीधे पार्टी के खाते में जमा',
          };
    }

    // बाक़ी सब — अपने मालिक module में नई प्रविष्टि
    const note =
      group === 'party' && !v.mapped.gstin && options.nonGstinParty === 'b2c-auto-create'
        ? 'फ़ैसला 2 (default, Option A) — B2C पार्टी बनेगी'
        : undefined;

    return { rowNumber: v.rowNumber, targetModule: owner, operation: 'create', payload: v.mapped, note };
  });
}
