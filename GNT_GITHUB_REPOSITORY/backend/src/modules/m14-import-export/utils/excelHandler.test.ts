// M14 — excelHandler ki jaanch (generateCSV/JSON/Excel, pure Buffer output)
import { test, expect } from 'vitest';
import { generateCSV, generateExcel, generateJSON } from './excelHandler';

const data = [
  { name: 'A', qty: 2, secret: 'x' },
  { name: 'B', qty: 3, secret: 'y' },
];

test('generateCSV: header + sirf selected fields (secret nahi)', () => {
  const csv = generateCSV(data, ['name', 'qty']).toString('utf8');
  expect(csv).toContain('name');
  expect(csv).toContain('qty');
  expect(csv).toContain('A');
  expect(csv).not.toContain('secret');
});

test('generateCSV: bina fields ke saara data aata hai', () => {
  const csv = generateCSV(data, []).toString('utf8');
  expect(csv).toContain('secret');
});

test('generateJSON: sirf selected fields, asli JSON array', () => {
  const parsed = JSON.parse(generateJSON(data, ['name']).toString('utf8'));
  expect(parsed).toEqual([{ name: 'A' }, { name: 'B' }]);
});

test('generateExcel: asli xlsx buffer (zip magic PK bytes)', () => {
  const buf = generateExcel(data, ['name', 'qty'], 'Report');
  expect(buf[0]).toBe(0x50); // 'P'
  expect(buf[1]).toBe(0x4b); // 'K'
  expect(buf.length).toBeGreaterThan(1000);
});
