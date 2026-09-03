// ============================================================================
// M07 PURCHASE MANAGEMENT — Zod Validators
// ============================================================================

import { z } from 'zod';

// ─── Item Schemas ───

export const purchaseInvoiceItemSchema = z.object({
  id: z.string().uuid().optional(),
  product_id: z.string().uuid({ message: 'Valid product is required' }),
  batch_id: z.string().uuid().nullable().optional(),
  quantity: z.number().positive({ message: 'Quantity must be greater than 0' }),
  rate: z.number().nonnegative({ message: 'Rate cannot be negative' }),
  discount_percent: z.number().min(0).max(100).optional(),
  discount_amount: z.number().nonnegative().optional(),
  amount: z.number().nonnegative().optional(),
  tax_rate: z.number().min(0).max(100).optional(),
  tax_amount: z.number().nonnegative().optional(),
  net_amount: z.number().nonnegative().optional(),
  hsn_code: z.string().max(50).optional(),
});

export const purchaseOrderItemSchema = z.object({
  id: z.string().uuid().optional(),
  product_id: z.string().uuid({ message: 'Valid product is required' }),
  quantity: z.number().positive({ message: 'Quantity must be greater than 0' }),
  rate: z.number().nonnegative({ message: 'Rate cannot be negative' }),
  discount_percent: z.number().min(0).max(100).optional(),
  discount_amount: z.number().nonnegative().optional(),
  amount: z.number().nonnegative().optional(),
  tax_rate: z.number().min(0).max(100).optional(),
  tax_amount: z.number().nonnegative().optional(),
  net_amount: z.number().nonnegative().optional(),
});

export const purchaseReturnItemSchema = z.object({
  id: z.string().uuid().optional(),
  product_id: z.string().uuid({ message: 'Valid product is required' }),
  quantity: z.number().positive({ message: 'Quantity must be greater than 0' }),
  rate: z.number().nonnegative({ message: 'Rate cannot be negative' }),
  amount: z.number().nonnegative().optional(),
  tax_amount: z.number().nonnegative().optional(),
  net_amount: z.number().nonnegative().optional(),
});

// ─── Master Schemas ───

export const createPurchaseInvoiceSchema = z.object({
  // company_id यहाँ नहीं — controller requireTenant(req) से भरता है (टास्क #009: body.company_id पर भरोसा नहीं)
  branch_id: z.string().uuid(),
  supplier_id: z.string().uuid({ message: 'Valid supplier is required' }),
  invoice_number: z.string().min(1).max(100, { message: 'Invoice number is required' }),
  invoice_date: z.coerce.date(),
  due_date: z.coerce.date().optional().nullable(),
  po_id: z.string().uuid().optional().nullable(),
  notes: z.string().optional(),
  round_off: z.number().optional(),
  items: z.array(purchaseInvoiceItemSchema).min(1, { message: 'At least one item is required' }),
  created_by: z.string().uuid().optional(),
});

export const updatePurchaseInvoiceSchema = z.object({
  supplier_id: z.string().uuid().optional(),
  invoice_number: z.string().min(1).max(100).optional(),
  invoice_date: z.coerce.date().optional(),
  due_date: z.coerce.date().optional().nullable(),
  po_id: z.string().uuid().optional().nullable(),
  notes: z.string().optional(),
  round_off: z.number().optional(),
  items: z.array(purchaseInvoiceItemSchema).optional(),
});

export const createPurchaseOrderSchema = z.object({
  // company_id यहाँ नहीं — controller requireTenant(req) से भरता है (टास्क #009)
  branch_id: z.string().uuid(),
  supplier_id: z.string().uuid({ message: 'Valid supplier is required' }),
  po_number: z.string().min(1).max(100, { message: 'PO number is required' }),
  po_date: z.coerce.date(),
  delivery_date: z.coerce.date().optional().nullable(),
  notes: z.string().optional(),
  terms_conditions: z.string().optional(),
  items: z.array(purchaseOrderItemSchema).min(1, { message: 'At least one item is required' }),
  created_by: z.string().uuid().optional(),
});

export const updatePurchaseOrderSchema = z.object({
  supplier_id: z.string().uuid().optional(),
  po_number: z.string().min(1).max(100).optional(),
  po_date: z.coerce.date().optional(),
  delivery_date: z.coerce.date().optional().nullable(),
  notes: z.string().optional(),
  terms_conditions: z.string().optional(),
  items: z.array(purchaseOrderItemSchema).optional(),
});

export const createPurchaseReturnSchema = z.object({
  // company_id यहाँ नहीं — controller requireTenant(req) से भरता है (टास्क #009)
  purchase_invoice_id: z.string().uuid({ message: 'Original invoice is required' }),
  supplier_id: z.string().uuid({ message: 'Valid supplier is required' }),
  return_number: z.string().min(1).max(100, { message: 'Return number is required' }),
  return_date: z.coerce.date(),
  reason: z.string().optional(),
  items: z.array(purchaseReturnItemSchema).min(1, { message: 'At least one item is required' }),
  created_by: z.string().uuid().optional(),
});

export const ocrUploadSchema = z.object({
  image: z.any().refine((file) => file instanceof Buffer || typeof file === 'object', {
    message: 'Image file is required',
  }),
});

export const ocrReviewSchema = z.object({
  invoice_id: z.string().uuid(),
  action: z.enum(['accept', 'reject']),
  ocr_data: z.object({
    supplier_name: z.object({ field: z.string(), value: z.union([z.string(), z.number(), z.date()]), confidence: z.number(), accepted: z.boolean() }).optional(),
    invoice_number: z.object({ field: z.string(), value: z.union([z.string(), z.number(), z.date()]), confidence: z.number(), accepted: z.boolean() }).optional(),
    invoice_date: z.object({ field: z.string(), value: z.union([z.string(), z.number(), z.date()]), confidence: z.number(), accepted: z.boolean() }).optional(),
    total_amount: z.object({ field: z.string(), value: z.union([z.string(), z.number(), z.date()]), confidence: z.number(), accepted: z.boolean() }).optional(),
    total_tax: z.object({ field: z.string(), value: z.union([z.string(), z.number(), z.date()]), confidence: z.number(), accepted: z.boolean() }).optional(),
    items: z.array(z.object({
      product_name: z.string(),
      quantity: z.number(),
      rate: z.number(),
      amount: z.number(),
      confidence: z.number(),
      accepted: z.boolean(),
    })),
    overall_confidence: z.number(),
  }),
});

export const purchaseInvoiceQuerySchema = z.object({
  company_id: z.string().uuid(),
  supplier_id: z.string().uuid().optional(),
  from_date: z.coerce.date().optional(),
  to_date: z.coerce.date().optional(),
  status: z.enum(['draft', 'approved', 'posted', 'paid', 'cancelled']).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const purchaseOrderQuerySchema = z.object({
  company_id: z.string().uuid(),
  supplier_id: z.string().uuid().optional(),
  status: z.enum(['draft', 'sent', 'partial', 'received', 'cancelled']).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

// ─── Type Exports ───
export type CreatePurchaseInvoiceInput = z.infer<typeof createPurchaseInvoiceSchema>;
export type UpdatePurchaseInvoiceInput = z.infer<typeof updatePurchaseInvoiceSchema>;
export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
export type UpdatePurchaseOrderInput = z.infer<typeof updatePurchaseOrderSchema>;
export type CreatePurchaseReturnInput = z.infer<typeof createPurchaseReturnSchema>;
export type OCRReviewInput = z.infer<typeof ocrReviewSchema>;
