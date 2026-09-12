/**
 * M28 — reports/report-export.service.ts
 * OWN: PDF/Excel/CSV export.
 *
 * WIRED (2026-09-12): verified no PDF/Excel library (pdfkit/exceljs/xlsx/
 * puppeteer) exists in backend/package.json. CSV export works today with
 * the built-in renderer below (no external dependency). PDF/XLSX renderers
 * are left unregistered — adding either is a new production dependency
 * choice for the owner, not guessed here.
 */

import { BuiltReport } from './report-builder';

export type ExportFormat = 'PDF' | 'XLSX' | 'CSV';

export interface ExportRenderer {
  render(report: BuiltReport): Promise<Buffer>;
}

export interface ExportedFile {
  format: ExportFormat;
  filename: string;
  content: Buffer;
}

/** Minimal built-in CSV renderer — safe default with no external dependency. */
class CsvExportRenderer implements ExportRenderer {
  async render(report: BuiltReport): Promise<Buffer> {
    const header = report.columns.join(',');
    const lines = report.rows.map((row) =>
      report.columns.map((col) => this.escapeCsv(row[col])).join(','),
    );
    return Buffer.from([header, ...lines].join('\n'), 'utf-8');
  }

  private escapeCsv(value: unknown): string {
    const str = value === undefined || value === null ? '' : String(value);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  }
}

export class ReportExportService {
  private renderers = new Map<ExportFormat, ExportRenderer>([['CSV', new CsvExportRenderer()]]);

  /** Register a real PDF/XLSX renderer once the project's library is verified. */
  registerRenderer(format: ExportFormat, renderer: ExportRenderer): void {
    this.renderers.set(format, renderer);
  }

  async export(report: BuiltReport, format: ExportFormat): Promise<ExportedFile> {
    const renderer = this.renderers.get(format);
    if (!renderer) {
      throw new Error(`No renderer registered for format ${format} — verify library before wiring`);
    }
    const content = await renderer.render(report);
    return {
      format,
      filename: `${report.templateId}_${Date.now()}.${format.toLowerCase()}`,
      content,
    };
  }
}

export const reportExportService = new ReportExportService();
