/**
 * M17 Reporting — Performance & Load Tests
 * Owner: D4-DELTA
 */
import { describe, it, expect } from 'vitest';
import { ReportGenerator } from '../../backend/src/modules/m17-reporting/services/report.generator';

describe('M17 — Report Generation Performance', () => {
  const generator = new ReportGenerator('/tmp/exports-test');

  it('should generate sales PDF under 2 seconds for 1000 rows', async () => {
    const mockData = {
      rows: Array.from({ length: 1000 }, (_, i) => ({
        invoiceId: `INV-${i}`,
        invoiceDate: '2026-08-15',
        customerName: `Customer ${i}`,
        productName: `Product ${i}`,
        quantity: 10,
        unitPrice: 100,
        grossAmount: 1000,
        discount: 0,
        taxableAmount: 1000,
        cgst: 90,
        sgst: 90,
        igst: 0,
        totalAmount: 1180,
        marginPercent: 18,
      })),
      summary: {
        totalInvoices: 1000,
        totalQuantity: 10000,
        totalGross: 1000000,
        totalDiscount: 0,
        totalTax: 180000,
        totalRevenue: 1180000,
        avgMargin: 18,
      },
    };

    const start = Date.now();
    const result = await generator.generate('sales', 'pdf', mockData);
    const duration = Date.now() - start;

    expect(result.fileSize).toBeGreaterThan(0);
    expect(duration).toBeLessThan(2000); // Under 2 seconds
  });

  it('should generate inventory Excel under 1.5 seconds for 5000 rows', async () => {
    const mockData = {
      rows: Array.from({ length: 5000 }, (_, i) => ({
        productId: `P-${i}`,
        productName: `Product ${i}`,
        sku: `SKU-${i}`,
        warehouse: 'WH-1',
        openingStock: 100,
        inwardQty: 50,
        outwardQty: 30,
        closingStock: 120,
        unitCost: 50,
        stockValue: 6000,
        reorderLevel: 50,
        stockStatus: 'ok' as const,
      })),
      valuation: {
        totalItems: 5000,
        totalStockValue: 30000000,
        lowStockCount: 0,
        overStockCount: 0,
      },
    };

    const start = Date.now();
    const result = await generator.generate('inventory', 'excel', mockData);
    const duration = Date.now() - start;

    expect(result.fileSize).toBeGreaterThan(0);
    expect(duration).toBeLessThan(1500);
  });

  it('should handle concurrent export requests', async () => {
    const mockData = { rows: [], summary: {} };

    const promises = Array.from({ length: 5 }, () =>
      generator.generate('sales', 'pdf', mockData)
    );

    const results = await Promise.all(promises);

    results.forEach(result => {
      expect(result.fileSize).toBeGreaterThan(0);
    });
  });
});
