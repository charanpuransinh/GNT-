import * as XLSX from 'xlsx';
import { ImportRow } from '../types/import.types';

export class ExcelParser {
  static parse(filePath: string, sheetIndex: number = 0): { headers: string[]; rows: ImportRow[] } {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[sheetIndex];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    if (data.length === 0) {
      return { headers: [], rows: [] };
    }

    const headers = data[0].map(h => String(h).trim());
    const rows: ImportRow[] = [];

    for (let i = 1; i < data.length; i++) {
      const row: ImportRow = { _rowNumber: i + 1 };
      headers.forEach((header, index) => {
        row[header] = data[i][index] ?? '';
      });
      rows.push(row);
    }

    return { headers, rows };
  }

  static preview(filePath: string, limit: number = 10, sheetIndex: number = 0) {
    const { headers, rows } = this.parse(filePath, sheetIndex);
    return {
      headers,
      rows: rows.slice(0, limit),
      totalRows: rows.length
    };
  }
}
