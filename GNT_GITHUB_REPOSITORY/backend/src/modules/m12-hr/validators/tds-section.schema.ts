// M12 — TDS section calculation input validation
import { z } from 'zod';

export const CalculateTdsDto = z.object({
  section: z.string().min(3).max(12),
  amount: z.number().nonnegative(),
  deducteeType: z.enum(['individual', 'huf', 'company', 'firm', 'other']).optional(),
});

export type CalculateTdsInput = z.infer<typeof CalculateTdsDto>;
