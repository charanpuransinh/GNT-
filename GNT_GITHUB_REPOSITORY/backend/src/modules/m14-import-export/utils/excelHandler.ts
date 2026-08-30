/**
 * ╔═══════════════════════════════════════════════════════════════════╗
 * ║  M14 IMPORT/EXPORT — EXCEL HANDLER                           ║
 * ║  Lock Artifact #13 — Export File Generation (CSV/Excel/JSON) ║
 * ╚═══════════════════════════════════════════════════════════════════╝
 */

import { stringify } from 'csv-stringify/sync';
import { stringify as stringifyStream } from 'csv-stringify';
import xlsx from 'xlsx';
import PDFDocument from 'pdfkit';
import { once } from 'events';
import { Readable } from 'stream';

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

// ── Generate PDF ──
export const generatePDF = async (
  data: Record<string, any>[],
  fields: string[],
  title: string
): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  const doc = new PDFDocument({ margin: 40 });
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));
  doc.fontSize(18).text(title);
  doc.moveDown();
  doc.fontSize(9);
  for (const [index, row] of data.entries()) {
    const values = fields.length
      ? fields.map(f => `${f}: ${String(row[f] ?? '')}`).join(' | ')
      : JSON.stringify(row);
    doc.text(`${index + 1}. ${values}`);
    if (doc.y > 740) doc.addPage();
  }
  doc.end();
  await once(doc, 'end');
  return Buffer.concat(chunks);
};

// ── Stream CSV (for large datasets) ──
export const streamCSV = (data: Record<string, any>[], fields: string[]): Readable => {
  const filtered = fields.length > 0
    ? data.map(row => {
        const obj: Record<string, any> = {};
        fields.forEach(f => { obj[f] = row[f]; });
        return obj;
      })
    : data;

  // Use csv-stringify stream mode for proper streaming of large datasets
  const csvStream = stringifyStream({ header: true });
  
  // Write data to stream
  for (const row of filtered) {
    csvStream.write(row);
  }
  csvStream.end();

  return csvStream as Readable;
};