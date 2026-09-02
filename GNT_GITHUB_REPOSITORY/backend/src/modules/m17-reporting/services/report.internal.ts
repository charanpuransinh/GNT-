/**
 * M17 Reporting — Query Builder Engine
 * Owner: D4-DELTA
 * INTERNAL ONLY — Not exposed publicly
 */
import {
  SalesReportFilters,
  PurchaseReportFilters,
  InventoryReportFilters,
  GSTReportFilters,
  AccountingReportFilters,
  HRReportFilters,
  ReportType,
  SalesReportData,
  PurchaseReportData,
  InventoryReportData,
  GSTReportData,
  AccountingReportData,
  HRReportData,
  ExecutiveDashboard,
} from '../types/report.types';

// ─── Cross-Module Service Interfaces (READ ONLY) ───
export interface IInventoryService {
  getStockSummary(filters: InventoryReportFilters): Promise<InventoryReportData>;
  getProductList(): Promise<{ id: string; name: string; sku: string }[]>;
}

export interface IPurchaseService {
  getPurchaseRegister(filters: PurchaseReportFilters): Promise<PurchaseReportData>;
}

export interface ISalesService {
  getSalesRegister(filters: SalesReportFilters): Promise<SalesReportData>;
}

export interface IGSTService {
  getGSTTransactions(filters: GSTReportFilters): Promise<GSTReportData>;
  getHSNSummary(): Promise<{ hsnCode: string; description: string; totalQuantity: number; taxableValue: number; cgstRate: number; sgstRate: number; igstRate: number; totalTax: number }[]>;
}

export interface IAccountingService {
  getLedgerEntries(filters: AccountingReportFilters): Promise<AccountingReportData>;
  getTrialBalance(): Promise<{ ledgerName: string; debit: number; credit: number }[]>;
  getCashflow(filters: AccountingReportFilters): Promise<{ openingBalance: number; totalInflow: number; totalOutflow: number; netFlow: number; closingBalance: number }>;
  getAgingReport(): Promise<{ partyName: string; totalOutstanding: number; days0_30: number; days31_60: number; days61_90: number; days91_plus: number }[]>;
}

export interface IHRService {
  getAttendanceReport(filters: HRReportFilters): Promise<{ employeeId: string; employeeName: string; department: string; month: string; presentDays: number; absentDays: number; leaveDays: number; halfDays: number; overtimeHours: number }[]>;
  getSalaryRegister(filters: HRReportFilters): Promise<{ employeeId: string; employeeName: string; basicSalary: number; hra: number; da: number; otherAllowances: number; grossSalary: number; pfDeduction: number; esiDeduction: number; tds: number; otherDeductions: number; netSalary: number }[]>;
  getEmployeeCount(): Promise<number>;
}

export class ReportQueryBuilder {
  constructor(
    private readonly inventoryService: IInventoryService,
    private readonly purchaseService: IPurchaseService,
    private readonly salesService: ISalesService,
    private readonly gstService: IGSTService,
    private readonly accountingService: IAccountingService,
    private readonly hrService: IHRService
  ) {}

  /**
   * Build and execute report query based on report type
   * LEGAL: Only calls public services from other modules (READ ONLY)
   * ILLEGAL: Direct table access or mutations
   */
  async buildReport(
    reportType: ReportType,
    filters: unknown
  ): Promise<unknown> {
    switch (reportType) {
      case 'sales':
        return this.buildSalesReport(filters as SalesReportFilters);
      case 'purchase':
        return this.buildPurchaseReport(filters as PurchaseReportFilters);
      case 'inventory':
        return this.buildInventoryReport(filters as InventoryReportFilters);
      case 'gst':
        return this.buildGSTReport(filters as GSTReportFilters);
      case 'accounting':
        return this.buildAccountingReport(filters as AccountingReportFilters);
      case 'hr':
        return this.buildHRReport(filters as HRReportFilters);
      case 'executive':
        return this.buildExecutiveDashboard();
      default:
        throw new Error(`Unsupported report type: ${reportType}`);
    }
  }

  private async buildSalesReport(filters: SalesReportFilters): Promise<SalesReportData> {
    // LEGAL: Call M08 sales.service.getSalesRegister() [READ ONLY]
    const data = await this.salesService.getSalesRegister(filters);

    // Apply additional M17-specific transformations
    const rows = data.rows.map(row => ({
      ...row,
      marginPercent: row.grossAmount > 0 
        ? Number((((row.totalAmount - row.grossAmount) / row.grossAmount) * 100).toFixed(2))
        : 0,
    }));

    const summary = {
      ...data.summary,
      avgMargin: rows.length > 0
        ? Number((rows.reduce((sum, r) => sum + r.marginPercent, 0) / rows.length).toFixed(2))
        : 0,
    };

    return { rows, summary };
  }

  private async buildPurchaseReport(filters: PurchaseReportFilters): Promise<PurchaseReportData> {
    // LEGAL: Call M07 purchase.service.getPurchaseRegister() [READ ONLY]
    const data = await this.purchaseService.getPurchaseRegister(filters);

    const summary = {
      totalPOs: data.rows.length,
      totalAmount: data.rows.reduce((sum, r) => sum + r.amount, 0),
      totalReceived: data.rows.reduce((sum, r) => sum + r.receivedQty, 0),
      totalPending: data.rows.reduce((sum, r) => sum + r.pendingQty, 0),
    };

    return { ...data, summary };
  }

  private async buildInventoryReport(filters: InventoryReportFilters): Promise<InventoryReportData> {
    // LEGAL: Call M06 inventory.service.getStockSummary() [READ ONLY]
    const data = await this.inventoryService.getStockSummary(filters);

    // Enrich with stock status
    const rows = data.rows.map(row => ({
      ...row,
      stockStatus: this.calculateStockStatus(row.closingStock, row.reorderLevel),
    }));

    const valuation = {
      ...data.valuation,
      lowStockCount: rows.filter(r => r.stockStatus === 'low').length,
      overStockCount: rows.filter(r => r.stockStatus === 'over').length,
    };

    return { rows, valuation };
  }

  private calculateStockStatus(closing: number, reorder: number): 'ok' | 'low' | 'over' | 'zero' {
    if (closing === 0) return 'zero';
    if (closing <= reorder) return 'low';
    if (closing >= reorder * 3) return 'over';
    return 'ok';
  }

  private async buildGSTReport(filters: GSTReportFilters): Promise<GSTReportData> {
    // LEGAL: Call M09 gst.service.getGSTTransactions() [READ ONLY]
    const data = await this.gstService.getGSTTransactions(filters);
    const hsnSummary = await this.gstService.getHSNSummary();

    const summary = {
      totalTaxable: data.rows.reduce((sum, r) => sum + r.taxableValue, 0),
      totalCGST: data.rows.reduce((sum, r) => sum + r.cgstAmount, 0),
      totalSGST: data.rows.reduce((sum, r) => sum + r.sgstAmount, 0),
      totalIGST: data.rows.reduce((sum, r) => sum + r.igstAmount, 0),
      grandTotalTax: data.rows.reduce((sum, r) => sum + r.totalTax, 0),
    };

    return { ...data, hsnSummary, summary };
  }

  private async buildAccountingReport(filters: AccountingReportFilters): Promise<AccountingReportData> {
    // LEGAL: Call M10 accounting.service.getLedgerEntries() [READ ONLY]
    const data = await this.accountingService.getLedgerEntries(filters);
    const cashflow = await this.accountingService.getCashflow(filters);
    const aging = await this.accountingService.getAgingReport();

    return { ...data, cashflow, aging };
  }

  private async buildHRReport(filters: HRReportFilters): Promise<HRReportData> {
    // LEGAL: Call M12 hr.service.getAttendanceReport() / getSalaryRegister() [READ ONLY]
    const attendance = await this.hrService.getAttendanceReport(filters);
    const salary = await this.hrService.getSalaryRegister(filters);

    const summary = {
      totalEmployees: salary.length,
      avgPresentDays: attendance.length > 0
        ? Number((attendance.reduce((sum, a) => sum + a.presentDays, 0) / attendance.length).toFixed(1))
        : 0,
      totalPayroll: salary.reduce((sum, s) => sum + s.grossSalary, 0),
      totalDeductions: salary.reduce((sum, s) => sum + (s.pfDeduction + s.esiDeduction + s.tds + s.otherDeductions), 0),
    };

    return { attendance, salary, summary };
  }

  private async buildExecutiveDashboard(): Promise<ExecutiveDashboard> {
    // Aggregate data from all modules for executive summary
    const [salesData, purchaseData, inventoryData, accountingData, employeeCount] = await Promise.all([
      this.salesService.getSalesRegister({}),
      this.purchaseService.getPurchaseRegister({}),
      this.inventoryService.getStockSummary({}),
      this.accountingService.getCashflow({}),
      this.hrService.getEmployeeCount(),
    ]);

    const totalRevenue = salesData.summary.totalRevenue;
    const totalPurchases = purchaseData.summary.totalAmount;
    const grossProfit = totalRevenue - totalPurchases;
    const netProfit = grossProfit * 0.85; // Simplified estimation

    return {
      kpis: {
        totalRevenue,
        totalPurchases,
        grossProfit,
        netProfit,
        totalReceivables: accountingData.closingBalance > 0 ? accountingData.closingBalance : 0,
        totalPayables: accountingData.closingBalance < 0 ? Math.abs(accountingData.closingBalance) : 0,
        stockValue: inventoryData.valuation.totalStockValue,
        employeeCount,
      },
      trends: [], // Would be populated from time-series data
      topCustomers: [],
      topProducts: [],
    };
  }
}
