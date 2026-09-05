// M14 — csvParser ki jaanch (parseCSV/JSON/XML/detectDelimiter/getFileInfo, temp files)
import { test, beforeAll, afterAll, expect } from 'vitest';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import os from 'os';
import path from 'path';
import { parseCSV, parseJSON, parseXML, detectDelimiter, getFileInfo } from './csvParser';

let tmpDir: string;
beforeAll(async () => {
  tmpDir = await mkdtemp(path.join(os.tmpdir(), 'm14-parser-'));
});
afterAll(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

test('parseCSV: header + rows sahi parse hoti hain', async () => {
  const fp = path.join(tmpDir, 'a.csv');
  await writeFile(fp, 'name,qty\nA,1\nB,2\n');
  const rows = await parseCSV(fp);
  expect(rows).toEqual([
    { name: 'A', qty: '1' },
    { name: 'B', qty: '2' },
  ]);
});

test('parseJSON: array bhi aur single object bhi (array me lapet)', async () => {
  const fpArr = path.join(tmpDir, 'arr.json');
  await writeFile(fpArr, JSON.stringify([{ a: 1 }, { a: 2 }]));
  expect(await parseJSON(fpArr)).toEqual([{ a: 1 }, { a: 2 }]);

  const fpSingle = path.join(tmpDir, 'single.json');
  await writeFile(fpSingle, JSON.stringify({ a: 1 }));
  expect(await parseJSON(fpSingle)).toEqual([{ a: 1 }]);
});

test('parseXML: root ke andar items milte hain', async () => {
  const fp = path.join(tmpDir, 'a.xml');
  await writeFile(fp, '<root><item><name>A</name></item><item><name>B</name></item></root>');
  const rows = await parseXML(fp);
  expect(rows.length).toBeGreaterThanOrEqual(1);
  expect(JSON.stringify(rows)).toContain('A');
});

test('detectDelimiter: pipe delimiter sahi pakadta hai', async () => {
  const fp = path.join(tmpDir, 'a.txt');
  await writeFile(fp, 'a|b|c\nd|e|f\n');
  expect(await detectDelimiter(fp)).toBe('|');
});

test('getFileInfo: format + extension + size sahi', async () => {
  const fp = path.join(tmpDir, 'info.csv');
  await writeFile(fp, 'name\nA\n');
  const info = getFileInfo(fp);
  expect(info.format).toBe('csv');
  expect(info.extension).toBe('.csv');
  expect(info.size).toBeGreaterThan(0);
});
