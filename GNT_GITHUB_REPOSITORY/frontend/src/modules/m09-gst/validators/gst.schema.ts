import { z } from 'zod';

export const frontendTaxSlabSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  cgst_rate: z.number().min(0).max(100),
  sgst_rate: z.number().min(0).max(100),
  igst_rate: z.number().min(0).max(100),
});

export const frontendHSNSchema = z.object({
  hsn_code: z.string().min(4, 'HSN must be at least 4 digits'),
  description: z.string().optional(),
  type: z.enum(['goods', 'services']),
  gst_rate: z.number().min(0).max(100).optional(),
});

export const frontendGSTINSchema = z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format');
