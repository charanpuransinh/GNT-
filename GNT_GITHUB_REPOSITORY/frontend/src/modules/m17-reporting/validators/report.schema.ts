/**
 * M17 Reporting — Zod Validation Schemas (Frontend)
 * Owner: D4-DELTA
 */
import { z } from 'zod';

export const ReportTypeSchema = z.enum([
  'sales',
  'purchase',
  'inventory',
  'gst',
  'accounting',
  'hr',
  'executive',
]);

export const ExportFormatSchema = z.enum(['pdf', 'excel', 'csv']);

export const DateRangeFilterSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const SalesReportFiltersSchema = DateRangeFilterSchema.extend({
  productId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  salesPersonId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
});

export const PurchaseReportFiltersSchema = DateRangeFilterSchema.extend({
  supplierId: z.string().uuid().optional(),
  poStatus: z.enum(['draft', 'sent', 'partial', 'received', 'closed', 'cancelled']).optional(),
  productId: z.string().uuid().optional(),
});

export const InventoryReportFiltersSchema = z.object({
  warehouseId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  stockStatus: z.enum(['all', 'low', 'over', 'zero']).optional(),
  asOfDate: z.string().optional(),
});

export const GSTReportFiltersSchema = DateRangeFilterSchema.extend({
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  hsnCode: z.string().optional(),
});

export const AccountingReportFiltersSchema = DateRangeFilterSchema.extend({
  ledgerId: z.string().uuid().optional(),
  voucherType: z.string().optional(),
  branchId: z.string().uuid().optional(),
});

export const HRReportFiltersSchema = DateRangeFilterSchema.extend({
  departmentId: z.string().uuid().optional(),
  employeeId: z.string().uuid().optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  year: z.number().int().min(2000).max(2100).optional(),
});

export const GenerateReportFormSchema = z.object({
  reportType: ReportTypeSchema,
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  productId: z.string().optional(),
  customerId: z.string().optional(),
  supplierId: z.string().optional(),
  warehouseId: z.string().optional(),
  gstin: z.string().optional(),
  ledgerId: z.string().optional(),
  departmentId: z.string().optional(),
  employeeId: z.string().optional(),
});

export type GenerateReportFormValues = z.infer<typeof GenerateReportFormSchema>;
