/**
 * M17 Reporting — PDF Export Integration Tests
 * Owner: D4-DELTA
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { existsSync } from 'fs';
import { unlink } from 'fs/promises';
import { ReportGenerator } from '../../backend/src/modules/m17-reporting/services/report.generator';

describe('M17 — PDF Export Integration', () => {
  const generator = new ReportGenerator('/tmp/exports-test');
  const generatedFiles: string[] = [];

  afterAll(async () => {
    // Cleanup generated files
    for (const file of generatedFiles) {
      if (existsSync(file)) await unlink(file);
    }
  });

  it('should export sales report as PDF', async () => {
    const data = {
      rows: [{
        invoiceId: 'INV-001',
        invoiceDate: '2026-08-15',
        customerName: 'ABC Corp',
        productName: 'Widget',
        quantity: 10,
        unitPrice: 100,
        grossAmount: 1000,
        discount: 50,
        taxableAmount: 950,
        cgst: 85.5,
        sgst: 85.5,
        igst: 0,
        totalAmount: 1121,
        marginPercent: 12.1,
      }],
      summary: {
        totalInvoices: 1,
        totalQuantity: 10,
        totalGross: 1000,
        totalDiscount: 50,
        totalTax: 171,
        totalRevenue: 1121,
        avgMargin: 12.1,
      },
    };

    const result = await generator.generate('sales', 'pdf', data);
    generatedFiles.push(result.filePath);

    expect(existsSync(result.filePath)).toBe(true);
    expect(result.fileName).toMatch(/sales-report-.*\.pdf/);
    expect(result.fileSize).toBeGreaterThan(0);
  });

  it('should export GST report as PDF with HSN summary', async () => {
    const data = {
      rows: [{
        invoiceId: 'INV-001',
        invoiceDate: '2026-08-15',
        gstin: '27AABCU9603R1ZM',
        taxableValue: 1000,
        cgstAmount: 90,
        sgstAmount: 90,
        igstAmount: 0,
        totalTax: 180,
        invoiceValue: 1180,
      }],
      hsnSummary: [{
        hsnCode: '8471',
        description: 'Computer Parts',
        totalQuantity: 10,
        taxableValue: 1000,
        cgstRate: 9,
        sgstRate: 9,
        igstRate: 0,
        totalTax: 180,
      }],
      summary: {
        totalTaxable: 1000,
        totalCGST: 90,
        totalSGST: 90,
        totalIGST: 0,
        grandTotalTax: 180,
      },
    };

    const result = await generator.generate('gst', 'pdf', data);
    generatedFiles.push(result.filePath);

    expect(existsSync(result.filePath)).toBe(true);
    expect(result.fileSize).toBeGreaterThan(0);
  });

  it('should apply template header/footer to PDF', async () => {
    const template = {
      id: 'tpl-1',
      companyId: 'comp-1',
      name: 'Standard Template',
      templateType: 'pdf' as const,
      layoutJson: {},
      headerHtml: '<div>Company Header</div>',
      footerHtml: '<div>Page Footer</div>',
      createdBy: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const data = { rows: [], summary: {} };
    const result = await generator.generate('sales', 'pdf', data, template);
    generatedFiles.push(result.filePath);

    expect(existsSync(result.filePath)).toBe(true);
  });
});
