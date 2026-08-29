/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║  M14 IMPORT/EXPORT — EXCEL HANDLER                           ║
 * ║  Lock Artifact #13 — Export File Generation (CSV/Excel/JSON) ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

import { stringify } from 'csv-stringify/sync';
import xlsx from 'xlsx';

// ── Generate CSV ──
export const generateCSV = (data: Record<string, any>[], fields: string[]): Buffer => {
  const filtered = fields.length > 0
    ? data.map(row => {
        const obj: Record<string, any> = {};
        fields.forEach(f => { obj[f] = row[f]; });
        return obj;
      })
    : data;

  const csv = stringify(filtered, { header: true });
  return Buffer.from(csv, 'utf-8');
};

// ── Generate Excel ──
export const generateExcel = (data: Record<string, any>[], fields: string[], sheetName: string): Buffer => {
  const filtered = fields.length > 0
    ? data.map(row => {
        const obj: Record<string, any> = {};
        fields.forEach(f => { obj[f] = row[f]; });
        return obj;
      })
    : data;

  const worksheet = xlsx.utils.json_to_sheet(filtered);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31));

  return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};

// ── Generate JSON ──
export const generateJSON = (data: Record<string, any>[], fields: string[]): Buffer => {
  const filtered = fields.length > 0
    ? data.map(row => {
        const obj: Record<string, any> = {};
        fields.forEach(f => { obj[f] = row[f]; });
        return obj;
      })
    : data;

  return Buffer.from(JSON.stringify(filtered, null, 2), 'utf-8');
};

// ── Generate PDF (Mock — requires puppeteer/pdfkit in production) ──
export const generatePDF = async (data: Record<string, any>[], fields: string[], title: string): Promise<Buffer> => {
  // TEMP MOCK: In production use puppeteer or pdfkit
  const lines = [
    title,
    '='.repeat(title.length),
    '',
    ...data.map((row, i) => `${i + 1}. ${fields.map(f => `${f}: ${row[f]}`).join(' | ')}`),
  ];
  return Buffer.from(lines.join('\n'), 'utf-8');
};

// ── Stream CSV (for large datasets) ──
export const streamCSV = (data: Record<string, any>[], fields: string[]): ReadableStream => {
  const filtered = fields.length > 0
    ? data.map(row => {
        const obj: Record<string, any> = {};
        fields.forEach(f => { obj[f] = row[f]; });
        return obj;
      })
    : data;

  // In production: use csv-stringify stream mode
  const csv = stringify(filtered, { header: true });
  return new ReadableStream({
    start(controller) {
      controller.enqueue(Buffer.from(csv));
      controller.close();
    },
  });
};
