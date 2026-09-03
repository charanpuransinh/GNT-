// GNT M20 — Frontend Zod Validation
// Owner: D4-DELTA

import { z } from 'zod';

export const TradeTypeEnum = z.enum(['import', 'export']);
export const TradeStatusEnum = z.enum(['draft', 'submitted', 'under_review', 'customs_cleared', 'completed', 'cancelled']);
export const DocumentTypeEnum = z.enum(['boe', 'shipping_bill', 'commercial_invoice', 'packing_list', 'certificate_of_origin']);

export const CreateShipmentSchema = z.object({
  type: TradeTypeEnum,
  reference_no: z.string().min(1, 'Reference number is required').max(50),
  party_id: z.string().min(1, 'Party is required'),
  product_id: z.string().min(1, 'Product is required'),
  hsn_code: z.string().regex(/^\d{8}$/, 'HSN code must be exactly 8 digits'),
  quantity: z.number().min(0, 'Quantity must be positive'),
  value_fob: z.number().min(0).optional(),
  value_cif: z.number().min(0).optional(),
  currency: z.string().default('USD'),
  fx_rate: z.number().min(0).optional(),
});

export const HSNCodeSchema = z.string().regex(/^\d{8}$/, 'HSN code must be exactly 8 digits');

export const SearchHSNSchema = z.object({
  q: z.string().min(2, 'Search query too short'),
  limit: z.number().int().min(1).max(100).default(20),
});

export const FXConvertSchema = z.object({
  amount: z.number().min(0, 'Amount must be positive'),
  from_currency: z.string().length(3, 'Currency code must be 3 letters'),
  to_currency: z.string().length(3, 'Currency code must be 3 letters'),
});

export const CustomsCalculateSchema = z.object({
  hsn_code: HSNCodeSchema,
  assessable_value: z.number().min(0, 'Value must be positive'),
  currency: z.string().default('USD'),
  fx_rate: z.number().min(0).optional(),
});

export const GenerateDocumentSchema = z.object({
  trade_job_id: z.string().min(1),
  document_type: DocumentTypeEnum,
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CreateShipmentInput = z.infer<typeof CreateShipmentSchema>;
export type SearchHSNInput = z.infer<typeof SearchHSNSchema>;
export type FXConvertInput = z.infer<typeof FXConvertSchema>;
export type CustomsCalculateInput = z.infer<typeof CustomsCalculateSchema>;
export type GenerateDocumentInput = z.infer<typeof GenerateDocumentSchema>;
