// GNT M06 — Inventory Zod Validators
import { z } from 'zod';

export const productSchema = z.object({
  company_id: z.string().uuid(),
  branch_id: z.string().uuid().optional().nullable(),
  name: z.string().min(1, 'Product name is required').max(255),
  code: z.string().max(100).optional().nullable(),
  barcode: z.string().max(100).optional().nullable(),
  hsn_code: z.string().max(50).optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  unit: z.string().max(50).optional().nullable(),
  alternate_unit: z.string().max(50).optional().nullable(),
  conversion_rate: z.number().positive().optional().nullable(),
  sale_price: z.number().nonnegative().optional().nullable(),
  purchase_price: z.number().nonnegative().optional().nullable(),
  mrp: z.number().nonnegative().optional().nullable(),
  gst_rate: z.number().min(0).max(100).optional().nullable(),
  cess_rate: z.number().min(0).max(100).optional().nullable(),
  is_gst_inclusive: z.boolean().default(false),
  min_stock: z.number().nonnegative().optional().nullable(),
  max_stock: z.number().nonnegative().optional().nullable(),
  reorder_level: z.number().nonnegative().optional().nullable(),
  description: z.string().optional().nullable(),
  image_url: z.string().url().optional().nullable(),
  is_active: z.boolean().default(true),
});

export const productUpdateSchema = productSchema.partial().omit({ company_id: true });

export const categorySchema = z.object({
  company_id: z.string().uuid(),
  name: z.string().min(1, 'Category name is required').max(255),
  parent_id: z.string().uuid().optional().nullable(),
  code: z.string().max(100).optional().nullable(),
  description: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
});

export const categoryUpdateSchema = categorySchema.partial().omit({ company_id: true });

export const stockAdjustmentSchema = z.object({
  product_id: z.string().uuid(),
  branch_id: z.string().uuid().optional().nullable(),
  batch_id: z.string().uuid().optional().nullable(),
  quantity: z.number(),
  reason: z.string().min(1, 'Reason is required'),
  reference: z.string().optional().nullable(),
  rate: z.number().nonnegative().optional().nullable(),
});

export const stockTransferSchema = z.object({
  product_id: z.string().uuid(),
  from_branch_id: z.string().uuid(),
  to_branch_id: z.string().uuid(),
  batch_id: z.string().uuid().optional().nullable(),
  quantity: z.number().positive('Transfer quantity must be positive'),
  notes: z.string().optional().nullable(),
});

export const batchSchema = z.object({
  company_id: z.string().uuid(),
  product_id: z.string().uuid(),
  batch_number: z.string().min(1, 'Batch number is required').max(100),
  mfg_date: z.string().datetime().optional().nullable(),
  expiry_date: z.string().datetime().optional().nullable(),
  quantity: z.number().nonnegative(),
  remaining_qty: z.number().nonnegative(),
  purchase_rate: z.number().nonnegative().optional().nullable(),
  mrp: z.number().nonnegative().optional().nullable(),
});

export const batchUpdateSchema = batchSchema.partial().omit({ company_id: true, product_id: true });

export const serialSchema = z.object({
  company_id: z.string().uuid(),
  product_id: z.string().uuid(),
  batch_id: z.string().uuid().optional().nullable(),
  serial_number: z.string().min(1, 'Serial number is required').max(255),
  status: z.enum(['in_stock', 'sold', 'returned', 'damaged']).default('in_stock'),
});

export const serialUpdateSchema = z.object({
  status: z.enum(['in_stock', 'sold', 'returned', 'damaged']),
  reference_type: z.string().optional().nullable(),
  reference_id: z.string().optional().nullable(),
});

export const availabilityCheckSchema = z.object({
  product_id: z.string().uuid(),
  branch_id: z.string().uuid().optional().nullable(),
  requested_qty: z.number().positive(),
});

export const productFilterSchema = z.object({
  search: z.string().optional(),
  category_id: z.string().uuid().optional(),
  branch_id: z.string().uuid().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  low_stock: z.boolean().optional(),
  status: z.string().optional(),
});

export const movementFilterSchema = z.object({
  product_id: z.string().uuid().optional(),
  branch_id: z.string().uuid().optional(),
  from_date: z.string().datetime().optional(),
  to_date: z.string().datetime().optional(),
  reference_type: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});
