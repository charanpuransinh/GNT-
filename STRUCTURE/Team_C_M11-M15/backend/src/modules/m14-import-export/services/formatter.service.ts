// M14 — Formatter Service
// Lock: LOCK_04_FORMATTER
import { ExportFormat } from '../types';
import xlsx from 'xlsx';
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';

export class FormatterService {
  async toCSV(data: any[], columns?: string[]): Promise<Buffer> {
    const opts = columns ? { fields: columns } : {};
    const parser = new Parser(opts);
    const csv = parser.parse(data);
    return Buffer.from(csv, 'utf-8');
  }

  async toExcel(data: any[], columns?: string[], sheetName = 'Export'): Promise<Buffer> {
    const filtered = columns ? data.map(row => {
      const obj: any = {};
      columns.forEach(c => obj[c] = row[c]);
      return obj;
    }) : data;

    const ws = xlsx.utils.json_to_sheet(filtered);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, sheetName);
    return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  async toJSON(data: any[]): Promise<Buffer> {
    return Buffer.from(JSON.stringify(data, null, 2), 'utf-8');
  }

  async toPDF(data: any[], columns?: string[], title = 'Export'): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 30 });
      const chunks: Buffer[] = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(18).text(title, 30, 30);
      doc.moveDown();

      const cols = columns || (data.length > 0 ? Object.keys(data[0]) : []);
      const colWidth = 500 / Math.max(cols.length, 1);
      let y = doc.y;

      // Header
      doc.fontSize(10).font('Helvetica-Bold');
      cols.forEach((c, i) => doc.text(c, 30 + i * colWidth, y, { width: colWidth }));
      y += 15;
      doc.font('Helvetica');

      data.forEach((row, idx) => {
        if (y > 750) { doc.addPage(); y = 30; }
        cols.forEach((c, i) => {
          const val = row[c] != null ? String(row[c]) : '';
          doc.text(val.substring(0, 30), 30 + i * colWidth, y, { width: colWidth });
        });
        y += 12;
      });

      doc.end();
    });
  }

  async format(data: any[], format: ExportFormat, columns?: string[]): Promise<Buffer> {
    switch (format) {
      case 'CSV': return this.toCSV(data, columns);
      case 'XLSX': return this.toExcel(data, columns);
      case 'JSON': return this.toJSON(data);
      case 'PDF': return this.toPDF(data, columns);
      default: throw new Error(`Unsupported format: ${format}`);
    }
  }
}
