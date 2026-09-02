/**
 * M17 Reporting — Input Validation (Zod)
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

export const ExportFormatSchema = z.enum(['pdf', 'excel', 'csv', 'html']);

export const DateRangeFilterSchema = z.object({
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
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
  asOfDate: z.string().datetime().optional(),
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

export const GenerateReportRequestSchema = z.object({
  reportType: ReportTypeSchema,
  filters: z.union([
    SalesReportFiltersSchema,
    PurchaseReportFiltersSchema,
    InventoryReportFiltersSchema,
    GSTReportFiltersSchema,
    AccountingReportFiltersSchema,
    HRReportFiltersSchema,
  ]),
  format: ExportFormatSchema.optional(),
  templateId: z.string().uuid().optional(),
});

export const ExportReportRequestSchema = z.object({
  reportType: ReportTypeSchema,
  format: ExportFormatSchema,
  data: z.record(z.string(), z.unknown()),
  templateId: z.string().uuid().optional(),
  fileName: z.string().min(1).max(255).optional(),
});

export const ReportConfigSchema = z.object({
  companyId: z.string().uuid(),
  name: z.string().min(1).max(255),
  reportType: ReportTypeSchema,
  filtersJson: z.record(z.string(), z.unknown()).default({}),
  schedule: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly']),
    dayOfWeek: z.number().int().min(0).max(6).optional(),
    dayOfMonth: z.number().int().min(1).max(31).optional(),
    time: z.string().regex(/^\d{2}:\d{2}$/),
    recipients: z.array(z.string().email()).min(1),
  }).optional(),
});

export const ReportTemplateSchema = z.object({
  companyId: z.string().uuid(),
  name: z.string().min(1).max(255),
  templateType: z.enum(['pdf', 'excel', 'html', 'csv']),
  layoutJson: z.record(z.string(), z.unknown()).default({}),
  headerHtml: z.string().optional(),
  footerHtml: z.string().optional(),
});

export type GenerateReportRequestDto = z.infer<typeof GenerateReportRequestSchema>;
export type ExportReportRequestDto = z.infer<typeof ExportReportRequestSchema>;
export type ReportConfigDto = z.infer<typeof ReportConfigSchema>;
export type ReportTemplateDto = z.infer<typeof ReportTemplateSchema>;
