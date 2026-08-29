import { z } from 'zod';

export const taxSlabSchema = z.object({
  company_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  cgst_rate: z.number().min(0).max(100),
  sgst_rate: z.number().min(0).max(100),
  igst_rate: z.number().min(0).max(100),
  cess_rate: z.number().min(0).max(100).optional(),
  effective_from: z.string().datetime().optional(),
  effective_to: z.string().datetime().optional(),
});

export const hsnSchema = z.object({
  company_id: z.string().uuid(),
  hsn_code: z.string().min(4).max(50),
  description: z.string().optional(),
  type: z.enum(['goods', 'services']),
  gst_rate: z.number().min(0).max(100).optional(),
  cess_rate: z.number().min(0).max(100).optional(),
});

export const gstinSchema = z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/);

export const calculateTaxSchema = z.object({
  items: z.array(z.object({
    hsn_code: z.string(),
    taxable_amount: z.number().positive(),
    quantity: z.number().optional(),
  })).min(1),
  state_code: z.string().length(2),
  company_state_code: z.string().length(2),
  company_id: z.string().uuid(),
});

export const eInvoiceSchema = z.object({
  invoice_id: z.string().uuid(),
});

export const eWayBillSchema = z.object({
  invoice_id: z.string().uuid(),
  transport_details: z.object({
    distance_km: z.number().positive(),
    vehicle_no: z.string().optional(),
    transporter_id: z.string().optional(),
    transporter_name: z.string().optional(),
  }),
});
