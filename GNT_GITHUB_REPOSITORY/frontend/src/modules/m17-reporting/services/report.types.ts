/**
 * M17 Reporting — Frontend DTOs
 * Owner: D4-DELTA
 */

export type ReportType = 'sales' | 'purchase' | 'inventory' | 'gst' | 'accounting' | 'hr' | 'executive';
export type ExportFormat = 'pdf' | 'excel' | 'csv';

export interface DateRangeFilter {
  dateFrom?: string;
  dateTo?: string;
}

export interface SalesReportFilters extends DateRangeFilter {
  productId?: string;
  customerId?: string;
  salesPersonId?: string;
  branchId?: string;
}

export interface PurchaseReportFilters extends DateRangeFilter {
  supplierId?: string;
  poStatus?: string;
  productId?: string;
}

export interface InventoryReportFilters {
  warehouseId?: string;
  productId?: string;
  categoryId?: string;
  stockStatus?: 'all' | 'low' | 'over' | 'zero';
  asOfDate?: string;
}

export interface GSTReportFilters extends DateRangeFilter {
  gstin?: string;
  taxRate?: number;
  hsnCode?: string;
}

export interface AccountingReportFilters extends DateRangeFilter {
  ledgerId?: string;
  voucherType?: string;
  branchId?: string;
}

export interface HRReportFilters extends DateRangeFilter {
  departmentId?: string;
  employeeId?: string;
  month?: string;
  year?: number;
}

export type ReportFilters =
  | SalesReportFilters
  | PurchaseReportFilters
  | InventoryReportFilters
  | GSTReportFilters
  | AccountingReportFilters
  | HRReportFilters;


/**
 * Filter panel ek hi form dikhata hai jisme har report ke field ho sakte hain,
 * isliye sab ka joda hua (intersection) roop. Har field optional hai, to koi takraav nahi.
 * Yeh ReportFilters ke har member ka subtype hai — isliye har page ka handler ise le sakta hai.
 */
export type AnyReportFilters = SalesReportFilters &
  PurchaseReportFilters &
  InventoryReportFilters &
  GSTReportFilters &
  AccountingReportFilters &
  HRReportFilters;

export interface ReportMeta {
  generatedAt: string;
  rowCount: number;
  reportType: ReportType;
  filters: ReportFilters;
}

export interface ReportResponse<T = unknown> {
  success: boolean;
  data: T;
  meta: ReportMeta;
}

// ─── Sales Report ───
export interface SalesReportRow {
  invoiceId: string;
  invoiceDate: string;
  customerName: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  grossAmount: number;
  discount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
  marginPercent: number;
}

export interface SalesSummary {
  totalInvoices: number;
  totalQuantity: number;
  totalGross: number;
  totalDiscount: number;
  totalTax: number;
  totalRevenue: number;
  avgMargin: number;
}

export interface SalesReportData {
  rows: SalesReportRow[];
  summary: SalesSummary;
}

// ─── Purchase Report ───
export interface PurchaseReportRow {
  poId: string;
  poDate: string;
  supplierName: string;
  status: string;
  productName: string;
  quantity: number;
  rate: number;
  amount: number;
  receivedQty: number;
  pendingQty: number;
}

export interface PurchaseReportData {
  rows: PurchaseReportRow[];
  summary: {
    totalPOs: number;
    totalAmount: number;
    totalReceived: number;
    totalPending: number;
  };
}

// ─── Inventory Report ───
export interface InventoryReportRow {
  productId: string;
  productName: string;
  sku: string;
  warehouse: string;
  openingStock: number;
  inwardQty: number;
  outwardQty: number;
  closingStock: number;
  unitCost: number;
  stockValue: number;
  reorderLevel: number;
  stockStatus: 'ok' | 'low' | 'over' | 'zero';
}

export interface InventoryValuation {
  totalItems: number;
  totalStockValue: number;
  lowStockCount: number;
  overStockCount: number;
}

export interface InventoryReportData {
  rows: InventoryReportRow[];
  valuation: InventoryValuation;
}

// ─── GST Report ───
export interface GSTReportRow {
  invoiceId: string;
  invoiceDate: string;
  gstin: string;
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  invoiceValue: number;
}

export interface HSNSummaryRow {
  hsnCode: string;
  description: string;
  totalQuantity: number;
  taxableValue: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  totalTax: number;
}

export interface GSTReportData {
  rows: GSTReportRow[];
  hsnSummary: HSNSummaryRow[];
  summary: {
    totalTaxable: number;
    totalCGST: number;
    totalSGST: number;
    totalIGST: number;
    grandTotalTax: number;
  };
}

// ─── Accounting Report ───
export interface AccountingReportRow {
  entryId: string;
  date: string;
  ledgerName: string;
  voucherType: string;
  voucherNo: string;
  debit: number;
  credit: number;
  narration: string;
}

export interface CashflowSummary {
  openingBalance: number;
  totalInflow: number;
  totalOutflow: number;
  netFlow: number;
  closingBalance: number;
}

export interface AgingRow {
  partyName: string;
  totalOutstanding: number;
  days0_30: number;
  days31_60: number;
  days61_90: number;
  days91_plus: number;
}

export interface AccountingReportData {
  rows: AccountingReportRow[];
  cashflow: CashflowSummary;
  aging: AgingRow[];
}

// ─── HR Report ───
export interface AttendanceRow {
  employeeId: string;
  employeeName: string;
  department: string;
  month: string;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  halfDays: number;
  overtimeHours: number;
}

export interface SalaryRow {
  employeeId: string;
  employeeName: string;
  basicSalary: number;
  hra: number;
  da: number;
  otherAllowances: number;
  grossSalary: number;
  pfDeduction: number;
  esiDeduction: number;
  tds: number;
  otherDeductions: number;
  netSalary: number;
}

export interface HRReportData {
  attendance: AttendanceRow[];
  salary: SalaryRow[];
  summary: {
    totalEmployees: number;
    avgPresentDays: number;
    totalPayroll: number;
    totalDeductions: number;
  };
}

// ─── Executive Dashboard ───
export interface ExecutiveDashboard {
  kpis: {
    totalRevenue: number;
    totalPurchases: number;
    grossProfit: number;
    netProfit: number;
    totalReceivables: number;
    totalPayables: number;
    stockValue: number;
    employeeCount: number;
  };
  trends: { month: string; revenue: number; purchases: number; expenses: number }[];
  topCustomers: { name: string; revenue: number }[];
  topProducts: { name: string; revenue: number }[];
}

// ─── Export ───
export interface ExportReportRequest {
  reportType: ReportType;
  format: ExportFormat;
  data: unknown;
  templateId?: string;
  fileName?: string;
}

export interface ExportReportResponse {
  success: boolean;
  downloadUrl: string;
  fileName: string;
  fileSize: number;
}
