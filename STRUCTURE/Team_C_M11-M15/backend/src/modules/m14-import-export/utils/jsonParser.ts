import { readFileSync } from 'fs';
import { ImportRow } from '../types/import.types';

export class JSONParser {
  static parse(filePath: string): { headers: string[]; rows: ImportRow[] } {
    const content = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    const rows = Array.isArray(data) ? data : [data];

    const allKeys = new Set<string>();
    rows.forEach(row => Object.keys(row).forEach(k => allKeys.add(k)));
    const headers = Array.from(allKeys);

    const normalizedRows: ImportRow[] = rows.map((row, index) => ({
      ...row,
      _rowNumber: index + 1
    }));

    return { headers, rows: normalizedRows };
  }

  static preview(filePath: string, limit: number = 10) {
    const { headers, rows } = this.parse(filePath);
    return {
      headers,
      rows: rows.slice(0, limit),
      totalRows: rows.length
    };
  }
}
