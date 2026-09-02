// GNT M20 — Zod Validation Schemas
// Owner: D4-DELTA

import { z } from 'zod';

export const TradeTypeEnum = z.enum(['import', 'export']);
export const TradeStatusEnum = z.enum(['draft', 'submitted', 'under_review', 'customs_cleared', 'completed', 'cancelled']);
export const DocumentTypeEnum = z.enum(['boe', 'shipping_bill', 'commercial_invoice', 'packing_list', 'certificate_of_origin']);

export const CreateTradeShipmentSchema = z.object({
  type: TradeTypeEnum,
  reference_no: z.string().min(1).max(50),
  party_id: z.string().min(1),
  product_id: z.string().min(1),
  hsn_code: z.string().regex(/^\d{8}$/, 'HSN code must be exactly 8 digits'),
  quantity: z.number().min(0),
  value_fob: z.number().min(0).optional(),
  value_cif: z.number().min(0).optional(),
  currency: z.string().default('USD'),
  fx_rate: z.number().min(0).optional(),
});

export const UpdateTradeShipmentSchema = CreateTradeShipmentSchema.partial().extend({
  status: TradeStatusEnum.optional(),
});

export const ListTradeJobsQuerySchema = z.object({
  type: TradeTypeEnum.optional(),
  status: TradeStatusEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const HSNCodeSchema = z.string().regex(/^\d{8}$/, 'HSN code must be exactly 8 digits');

export const HSNValidationSchema = z.object({
  code: HSNCodeSchema,
  product_description: z.string().min(1),
});

export const SearchHSNQuerySchema = z.object({
  q: z.string().min(2),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const FXRateSchema = z.object({
  base_currency: z.string().min(3).max(3).default('INR'),
  target_currency: z.string().min(3).max(3),
  rate: z.number().positive(),
  source: z.string().default('manual'),
  effective_date: z.coerce.date().optional(),
});

export const FXConvertSchema = z.object({
  amount: z.number().min(0),
  from_currency: z.string().min(3).max(3),
  to_currency: z.string().min(3).max(3),
});

export const CustomsCalculateSchema = z.object({
  hsn_code: HSNCodeSchema,
  assessable_value: z.number().min(0),
  currency: z.string().default('USD'),
  fx_rate: z.number().min(0).optional(),
});

export const GenerateDocumentSchema = z.object({
  trade_job_id: z.string().min(1),
  document_type: DocumentTypeEnum,
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CreateTradeShipmentInput = z.infer<typeof CreateTradeShipmentSchema>;
export type UpdateTradeShipmentInput = z.infer<typeof UpdateTradeShipmentSchema>;
export type ListTradeJobsQuery = z.infer<typeof ListTradeJobsQuerySchema>;
export type HSNValidationInput = z.infer<typeof HSNValidationSchema>;
export type SearchHSNQuery = z.infer<typeof SearchHSNQuerySchema>;
export type FXRateInput = z.infer<typeof FXRateSchema>;
export type FXConvertInput = z.infer<typeof FXConvertSchema>;
export type CustomsCalculateInput = z.infer<typeof CustomsCalculateSchema>;
export type GenerateDocumentInput = z.infer<typeof GenerateDocumentSchema>;
