// M17 — Report generation engine ki jaanch (CSV/Excel/PDF real output)
import { test, beforeAll, afterAll, expect } from 'vitest';
import { mkdtemp, rm, readFile } from 'fs/promises';
import os from 'os';
import path from 'path';
import { ReportGenerator } from './report.generator';

let tmpDir: string;
beforeAll(async () => {
  tmpDir = await mkdtemp(path.join(os.tmpdir(), 'm17-report-'));
});
afterAll(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

const salesData = {
  rows: [{
    invoiceId: 'INV-1', invoiceDate: '2026-01-01', customerName: 'Acme', productName: 'Widget',
    quantity: 1, unitPrice: 100, grossAmount: 100, discount: 0, taxableAmount: 100,
    cgst: 9, sgst: 9, igst: 0, totalTax: 18, totalAmount: 118, marginPercent: 10,
  }],
  summary: {
    totalInvoices: 1, totalQuantity: 1, totalGross: 100, totalDiscount: 0,
    totalTax: 18, totalRevenue: 100, avgMargin: 10,
  },
};

test('CSV report generate hota hai — file + content', async () => {
  const gen = new ReportGenerator(tmpDir);
  const r = await gen.generate('sales', 'csv', { rows: [{ party: 'Acme' }] });

  expect(r.fileName).toMatch(/^sales-report-.*\.csv$/);
  expect(r.fileSize).toBeGreaterThan(0);

  const content = await readFile(r.filePath, 'utf8');
  expect(content).toContain('sales');
  expect(content).toContain('Acme');
});

test('Excel report generate hota hai — sales data', async () => {
  const gen = new ReportGenerator(tmpDir);
  const r = await gen.generate('sales', 'excel', salesData);

  expect(r.fileName).toMatch(/^sales-report-.*\.xlsx$/);
  expect(r.fileSize).toBeGreaterThan(0);
});

test('PDF report bhi ban jata hai — sales data', async () => {
  const gen = new ReportGenerator(tmpDir);
  const r = await gen.generate('sales', 'pdf', salesData);

  expect(r.fileName).toMatch(/^sales-report-.*\.pdf$/);
  expect(r.fileSize).toBeGreaterThan(0);
});

test('unsupported format → saaf error', async () => {
  const gen = new ReportGenerator(tmpDir);
  await expect(gen.generate('sales', 'html', {})).rejects.toThrow(/Unsupported export format/);
});
