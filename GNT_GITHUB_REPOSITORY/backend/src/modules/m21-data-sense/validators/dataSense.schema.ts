/** M21 — आने वाली request की जाँच */
import { z } from 'zod';

export const analyzeSheetSchema = z.object({
  sheetName: z.string().max(200).optional(),
  headers: z.array(z.string().max(200)).min(1, 'कम से कम एक header चाहिए').max(200),
  rows: z.array(z.record(z.string(), z.unknown())).max(5000, 'एक बार में 5000 पंक्तियाँ तक'),
});

export type AnalyzeSheetInput = z.infer<typeof analyzeSheetSchema>;
