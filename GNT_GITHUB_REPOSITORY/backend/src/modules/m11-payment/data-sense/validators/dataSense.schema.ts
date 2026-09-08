/** M21 — आने वाली request की जाँच */
import { z } from 'zod';

/** मालिक के 3 फ़ैसले — UI का toggle यही भेजता है (न भेजो तो default लगते हैं) */
export const dataSenseOptionsSchema = z.object({
  duplicatePolicy: z.literal('review-zone').optional(),
  nonGstinParty: z.enum(['b2c-auto-create', 'suspense-zone']).optional(),
  bankReconciliation: z.enum(['direct-ledger-credit', 'fifo-invoice-settlement']).optional(),
});

export const analyzeSheetSchema = z.object({
  sheetName: z.string().max(200).optional(),
  headers: z.array(z.string().max(200)).min(1, 'कम से कम एक header चाहिए').max(200),
  rows: z.array(z.record(z.string(), z.unknown())).max(5000, 'एक बार में 5000 पंक्तियाँ तक'),
  options: dataSenseOptionsSchema.optional(),
});

export type AnalyzeSheetInput = z.infer<typeof analyzeSheetSchema>;
