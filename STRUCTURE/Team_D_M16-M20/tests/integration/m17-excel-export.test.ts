/**
 * M17 Reporting — Excel Export Integration Tests
 * Owner: D4-DELTA
 */
import { describe, it, expect, afterAll } from 'vitest';
import { existsSync } from 'fs';
import { unlink } from 'fs/promises';
import { ReportGenerator } from '../../backend/src/modules/m17-reporting/services/report.generator';

describe('M17 — Excel Export Integration', () => {
  const generator = new ReportGenerator('/tmp/exports-test');
  const generatedFiles: string[] = [];

  afterAll(async () => {
    for (const file of generatedFiles) {
      if (existsSync(file)) await unlink(file);
    }
  });

  it('should export purchase report as Excel', async () => {
    const data = {
      rows: [{
        poId: 'PO-001',
        poDate: '2026-08-10',
        supplierName: 'Supplier A',
        status: 'received',
        productName: 'Raw Material',
        quantity: 100,
        rate: 50,
        amount: 5000,
        receivedQty: 100,
        pendingQty: 0,
      }],
      summary: {
        totalPOs: 1,
        totalAmount: 5000,
        totalReceived: 100,
        totalPending: 0,
      },
    };

    const result = await generator.generate('purchase', 'excel', data);
    generatedFiles.push(result.filePath);

    expect(existsSync(result.filePath)).toBe(true);
    expect(result.fileName).toMatch(/purchase-report-.*\.xlsx/);
    expect(result.fileSize).toBeGreaterThan(0);
  });

  it('should export HR report as Excel with multiple sheets', async () => {
    const data = {
      attendance: [{
        employeeId: 'E001',
        employeeName: 'John Doe',
        department: 'Engineering',
        month: '2026-08',
        presentDays: 22,
        absentDays: 2,
        leaveDays: 4,
        halfDays: 0,
        overtimeHours: 10,
      }],
      salary: [{
        employeeId: 'E001',
        employeeName: 'John Doe',
        basicSalary: 30000,
        hra: 12000,
        da: 6000,
        otherAllowances: 2000,
        grossSalary: 50000,
        pfDeduction: 3600,
        esiDeduction: 0,
        tds: 2500,
        otherDeductions: 500,
        netSalary: 43400,
      }],
      summary: {
        totalEmployees: 1,
        avgPresentDays: 22,
        totalPayroll: 50000,
        totalDeductions: 6600,
      },
    };

    const result = await generator.generate('hr', 'excel', data);
    generatedFiles.push(result.filePath);

    expect(existsSync(result.filePath)).toBe(true);
    expect(result.fileSize).toBeGreaterThan(0);
  });

  it('should apply template column widths to Excel', async () => {
    const template = {
      id: 'tpl-2',
      companyId: 'comp-1',
      name: 'Excel Template',
      templateType: 'excel' as const,
      layoutJson: { columnWidths: [20, 30, 15, 15, 15, 15, 15, 15] },
      createdBy: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const data = { rows: [], summary: {} };
    const result = await generator.generate('sales', 'excel', data, template);
    generatedFiles.push(result.filePath);

    expect(existsSync(result.filePath)).toBe(true);
  });

  it('should export CSV format', async () => {
    const data = { rows: [{ id: '1', name: 'Test' }], summary: {} };
    const result = await generator.generate('inventory', 'csv', data);
    generatedFiles.push(result.filePath);

    expect(existsSync(result.filePath)).toBe(true);
    expect(result.fileName).toMatch(/inventory-report-.*\.csv/);
  });
});
