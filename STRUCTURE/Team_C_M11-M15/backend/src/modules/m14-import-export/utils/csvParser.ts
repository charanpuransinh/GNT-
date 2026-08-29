/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║  M14 IMPORT/EXPORT — CSV PARSER                              ║
 * ║  Lock Artifact #12 — CSV/JSON/XML File Parsing Utilities     ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

import fs from 'fs';
import path from 'path';
import csv from 'csv-parser'; // npm package
import xlsx from 'xlsx'; // npm package

// ── Parse CSV ──
export const parseCSV = (filePath: string, limit?: number): Promise<Record<string, any>[]> => {
  return new Promise((resolve, reject) => {
    const results: Record<string, any>[] = [];
    const stream = fs.createReadStream(filePath).pipe(csv());

    stream.on('data', (data: Record<string, any>) => {
      if (limit && results.length >= limit) {
        stream.destroy();
        return;
      }
      results.push(data);
    });

    stream.on('end', () => resolve(results));
    stream.on('error', (err) => reject(err));
  });
};

// ── Parse Excel ──
export const parseExcel = (filePath: string, limit?: number): Promise<Record<string, any>[]> => {
  return new Promise((resolve, reject) => {
    try {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet, { defval: '' }) as Record<string, any>[];

      resolve(limit ? data.slice(0, limit) : data);
    } catch (err) {
      reject(err);
    }
  });
};

// ── Parse JSON ──
export const parseJSON = (filePath: string, limit?: number): Promise<Record<string, any>[]> => {
  return new Promise((resolve, reject) => {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      const rows = Array.isArray(data) ? data : [data];
      resolve(limit ? rows.slice(0, limit) : rows);
    } catch (err) {
      reject(err);
    }
  });
};

// ── Parse XML (Basic) ──
export const parseXML = (filePath: string, limit?: number): Promise<Record<string, any>[]> => {
  return new Promise((resolve, reject) => {
    try {
      // In production: use fast-xml-parser or xml2js
      // This is a simplified mock
      const content = fs.readFileSync(filePath, 'utf-8');
      // Mock parsing - in real implementation use proper XML parser
      const rows: Record<string, any>[] = [];
      resolve(limit ? rows.slice(0, limit) : rows);
    } catch (err) {
      reject(err);
    }
  });
};

// ── Detect Delimiter ──
export const detectDelimiter = (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const firstLine = content.split('\n')[0];

      const delimiters = [',', '\t', ';', '|'];
      const counts = delimiters.map(d => ({ delimiter: d, count: (firstLine.match(new RegExp(d, 'g')) || []).length }));
      const best = counts.reduce((a, b) => (a.count > b.count ? a : b));

      resolve(best.delimiter);
    } catch (err) {
      reject(err);
    }
  });
};

// ── Get File Info ──
export const getFileInfo = (filePath: string) => {
  const stat = fs.statSync(filePath);
  const ext = path.extname(filePath).toLowerCase();

  const formatMap: Record<string, string> = {
    '.csv': 'csv',
    '.xls': 'excel',
    '.xlsx': 'excel',
    '.json': 'json',
    '.xml': 'xml',
  };

  return {
    path: filePath,
    size: stat.size,
    format: formatMap[ext] || 'unknown',
    extension: ext,
    modifiedAt: stat.mtime,
  };
};
