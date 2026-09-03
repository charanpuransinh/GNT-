// M14 — Parser Service
// Lock: LOCK_03_PARSER
import { ParseResult, ParseError, FileType } from '../types';
import csv from 'csv-parser';
import xlsx from 'xlsx';
import { Readable } from 'stream';

export class ParserService {
  async parseCSV(buffer: Buffer, options?: { skipHeader?: boolean }): Promise<ParseResult> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      const errors: ParseError[] = [];
      const stream = Readable.from(buffer.toString());
      let rowIndex = options?.skipHeader ? 1 : 0;
      let headers: string[] = [];

      stream
        .pipe(csv())
        .on('headers', (h: string[]) => { headers = h; })
        .on('data', (data: any) => {
          rowIndex++;
          try {
            // Basic sanitization
            const clean: Record<string, any> = {};
            for (const [k, v] of Object.entries(data)) {
              const key = k.trim();
              const val = typeof v === 'string' ? v.trim() : v;
              clean[key] = val === '' ? null : val;
            }
            results.push(clean);
          } catch (err: any) {
            errors.push({ row: rowIndex, message: err.message, code: 'PARSE_ERROR' });
          }
        })
        .on('end', () => resolve({
          data: results,
          errors,
          meta: { totalRows: rowIndex, validRows: results.length, headers }
        }))
        .on('error', (err: Error) => reject(err));
    });
  }

  async parseExcel(buffer: Buffer): Promise<ParseResult> {
    try {
      const workbook = xlsx.read(buffer, { type: 'buffer', cellDates: true });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = xlsx.utils.sheet_to_json(sheet, { defval: null, raw: false });
      const headers = json.length > 0 ? Object.keys(json[0] as object) : [];

      const errors: ParseError[] = [];
      const data = json.map((row: any, idx: number) => {
        try {
          const clean: Record<string, any> = {};
          for (const [k, v] of Object.entries(row)) {
            clean[k.trim()] = typeof v === 'string' ? v.trim() : v;
          }
          return clean;
        } catch (err: any) {
          errors.push({ row: idx + 2, message: err.message, code: 'PARSE_ERROR' });
          return null;
        }
      }).filter((x): x is Record<string, any> => x !== null);

      return {
        data,
        errors,
        meta: { totalRows: json.length, validRows: data.length, headers }
      };
    } catch (err: any) {
      throw new Error(`Excel parse failed: ${err.message}`);
    }
  }

  async parseJSON(buffer: Buffer): Promise<ParseResult> {
    try {
      const raw = JSON.parse(buffer.toString());
      const data = Array.isArray(raw) ? raw : [raw];
      const headers = data.length > 0 ? Object.keys(data[0]) : [];
      return {
        data,
        errors: [],
        meta: { totalRows: data.length, validRows: data.length, headers }
      };
    } catch (err: any) {
      throw new Error(`JSON parse failed: ${err.message}`);
    }
  }

  async parse(buffer: Buffer, fileType: FileType, options?: any): Promise<ParseResult> {
    switch (fileType) {
      case 'csv': return this.parseCSV(buffer, options);
      case 'xlsx': return this.parseExcel(buffer);
      case 'json': return this.parseJSON(buffer);
      default: throw new Error(`Unsupported file type: ${fileType}`);
    }
  }
}
