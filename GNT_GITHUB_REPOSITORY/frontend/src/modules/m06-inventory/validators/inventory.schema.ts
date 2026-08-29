// GNT M06 — Frontend Zod Validators
import { z } from 'zod';

export const productFormSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255),
  code: z.string().max(100).optional(),
  barcode: z.string().max(100).optional(),
  hsn_code: z.string().max(50).optional(),
  category_id: z.string().uuid().optional(),
  unit: z.string().max(50).optional(),
  alternate_unit: z.string().max(50).optional(),
  conversion_rate: z.number().positive().optional(),
  sale_price: z.number().nonnegative().optional(),
  purchase_price: z.number().nonnegative().optional(),
  mrp: z.number().nonnegative().optional(),
  gst_rate: z.number().min(0).max(100).optional(),
  cess_rate: z.number().min(0).max(100).optional(),
  is_gst_inclusive: z.boolean().default(false),
  min_stock: z.number().nonnegative().optional(),
  max_stock: z.number().nonnegative().optional(),
  reorder_level: z.number().nonnegative().optional(),
  description: z.string().optional(),
  image_url: z.string().url().optional(),
  is_active: z.boolean().default(true),
});

export const stockAdjustmentFormSchema = z.object({
  product_id: z.string().uuid(),
  branch_id: z.string().uuid().optional(),
  batch_id: z.string().uuid().optional(),
  quantity: z.number(),
  reason: z.string().min(1, 'Reason is required'),
  reference: z.string().optional(),
  rate: z.number().nonnegative().optional(),
});

export const stockTransferFormSchema = z.object({
  product_id: z.string().uuid(),
  from_branch_id: z.string().uuid(),
  to_branch_id: z.string().uuid(),
  batch_id: z.string().uuid().optional(),
  quantity: z.number().positive('Quantity must be positive'),
  notes: z.string().optional(),
});

export const categoryFormSchema = z.object({
  name: z.string().min(1, 'Category name is required').max(255),
  parent_id: z.string().uuid().optional(),
  code: z.string().max(100).optional(),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
});
