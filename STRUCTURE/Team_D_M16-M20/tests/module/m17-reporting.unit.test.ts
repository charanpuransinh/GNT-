/**
 * M17 Reporting — Unit Tests
 * Owner: D4-DELTA
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReportService } from '../../backend/src/modules/m17-reporting/services/report.service';
import { ReportRepository } from '../../backend/src/modules/m17-reporting/repositories/report.repository';
import { ReportQueryBuilder } from '../../backend/src/modules/m17-reporting/services/report.internal';
import { ReportGenerator } from '../../backend/src/modules/m17-reporting/services/report.generator';
import { ReportController } from '../../backend/src/modules/m17-reporting/controllers/report.controller';

// Mock Prisma
const mockPrisma = {
  reportConfig: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  reportTemplate: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

// Mock cross-module services
const mockInventoryService = { getStockSummary: vi.fn(), getProductList: vi.fn() };
const mockPurchaseService = { getPurchaseRegister: vi.fn() };
const mockSalesService = { getSalesRegister: vi.fn() };
const mockGSTService = { getGSTTransactions: vi.fn(), getHSNSummary: vi.fn() };
const mockAccountingService = { getLedgerEntries: vi.fn(), getTrialBalance: vi.fn(), getCashflow: vi.fn(), getAgingReport: vi.fn() };
const mockHRService = { getAttendanceReport: vi.fn(), getSalaryRegister: vi.fn(), getEmployeeCount: vi.fn() };

describe('M17 Reporting — Unit Tests', () => {
  let repository: ReportRepository;
  let service: ReportService;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new ReportRepository(mockPrisma as any);
    service = new ReportService(
      repository,
      mockInventoryService as any,
      mockPurchaseService as any,
      mockSalesService as any,
      mockGSTService as any,
      mockAccountingService as any,
      mockHRService as any,
      '/tmp/exports'
    );
  });

  describe('ReportRepository', () => {
    it('should create report config', async () => {
      const mockConfig = { id: '1', name: 'Test Config', reportType: 'sales' };
      mockPrisma.reportConfig.create.mockResolvedValue(mockConfig);

      const result = await repository.createConfig({
        companyId: 'comp-1',
        name: 'Test Config',
        reportType: 'sales',
        filtersJson: {},
        createdBy: 'user-1',
      });

      expect(result).toEqual(mockConfig);
      expect(mockPrisma.reportConfig.create).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should find config by id and company', async () => {
      const mockConfig = { id: '1', companyId: 'comp-1' };
      mockPrisma.reportConfig.findFirst.mockResolvedValue(mockConfig);

      const result = await repository.findConfigById('1', 'comp-1');
      expect(result).toEqual(mockConfig);
    });

    it('should enforce company isolation on delete', async () => {
      mockPrisma.reportConfig.findFirst.mockResolvedValue(null);

      await expect(repository.deleteConfig('1', 'comp-1')).rejects.toThrow('Report config not found');
    });
  });

  describe('ReportQueryBuilder', () => {
    it('should build sales report with margin calculation', async () => {
      const mockSalesData = {
        rows: [{
          invoiceId: 'inv-1',
          invoiceDate: '2026-08-01',
          customerName: 'Customer A',
          productName: 'Product X',
          quantity: 10,
          unitPrice: 100,
          grossAmount: 1000,
          discount: 0,
          taxableAmount: 1000,
          cgst: 90,
          sgst: 90,
          igst: 0,
          totalAmount: 1180,
          marginPercent: 0,
        }],
        summary: {
          totalInvoices: 1,
          totalQuantity: 10,
          totalGross: 1000,
          totalDiscount: 0,
          totalTax: 180,
          totalRevenue: 1180,
          avgMargin: 0,
        },
      };
      mockSalesService.getSalesRegister.mockResolvedValue(mockSalesData);

      const queryBuilder = new ReportQueryBuilder(
        mockInventoryService as any,
        mockPurchaseService as any,
        mockSalesService as any,
        mockGSTService as any,
        mockAccountingService as any,
        mockHRService as any
      );

      const result = await queryBuilder.buildReport('sales', { dateFrom: '2026-08-01', dateTo: '2026-08-31' });
      const data = result as any;

      expect(data.rows[0].marginPercent).toBe(18);
      expect(data.summary.avgMargin).toBe(18);
    });

    it('should build inventory report with stock status', async () => {
      const mockInventoryData = {
        rows: [{
          productId: 'p1',
          productName: 'Widget',
          sku: 'W-001',
          warehouse: 'WH-1',
          openingStock: 100,
          inwardQty: 50,
          outwardQty: 30,
          closingStock: 120,
          unitCost: 50,
          stockValue: 6000,
          reorderLevel: 50,
          stockStatus: 'ok' as const,
        }],
        valuation: {
          totalItems: 1,
          totalStockValue: 6000,
          lowStockCount: 0,
          overStockCount: 0,
        },
      };
      mockInventoryService.getStockSummary.mockResolvedValue(mockInventoryData);

      const queryBuilder = new ReportQueryBuilder(
        mockInventoryService as any,
        mockPurchaseService as any,
        mockSalesService as any,
        mockGSTService as any,
        mockAccountingService as any,
        mockHRService as any
      );

      const result = await queryBuilder.buildReport('inventory', {});
      const data = result as any;

      expect(data.rows[0].stockStatus).toBe('over'); // 120 >= 50*3
      expect(data.valuation.overStockCount).toBe(1);
    });
  });

  describe('ReportService — Public API', () => {
    it('should generate report successfully', async () => {
      mockSalesService.getSalesRegister.mockResolvedValue({
        rows: [],
        summary: { totalInvoices: 0, totalQuantity: 0, totalGross: 0, totalDiscount: 0, totalTax: 0, totalRevenue: 0, avgMargin: 0 },
      });

      const result = await service.generateReport(
        { reportType: 'sales', filters: { dateFrom: '2026-08-01', dateTo: '2026-08-31' } },
        'comp-1'
      );

      expect(result.success).toBe(true);
      expect(result.meta.reportType).toBe('sales');
    });

    it('should get executive dashboard', async () => {
      mockSalesService.getSalesRegister.mockResolvedValue({
        rows: [], summary: { totalInvoices: 0, totalQuantity: 0, totalGross: 0, totalDiscount: 0, totalTax: 0, totalRevenue: 100000, avgMargin: 0 },
      });
      mockPurchaseService.getPurchaseRegister.mockResolvedValue({
        rows: [], summary: { totalPOs: 0, totalAmount: 50000, totalReceived: 0, totalPending: 0 },
      });
      mockInventoryService.getStockSummary.mockResolvedValue({
        rows: [], valuation: { totalItems: 0, totalStockValue: 20000, lowStockCount: 0, overStockCount: 0 },
      });
      mockAccountingService.getCashflow.mockResolvedValue({
        openingBalance: 0, totalInflow: 0, totalOutflow: 0, netFlow: 0, closingBalance: 10000,
      });
      mockHRService.getEmployeeCount.mockResolvedValue(50);

      const result = await service.getExecutiveDashboard('comp-1');

      expect(result.success).toBe(true);
      expect(result.data.kpis.totalRevenue).toBe(100000);
      expect(result.data.kpis.grossProfit).toBe(50000);
      expect(result.data.kpis.employeeCount).toBe(50);
    });
  });
});
