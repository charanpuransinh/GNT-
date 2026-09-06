// M14 — preview duplicate warning (owner spec: "preview me duplicate/error warning")
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, writeFile, rm } from 'fs/promises';
import os from 'os';
import path from 'path';
import { ImportService } from './import.service';

describe('M14 preview duplicate warning', () => {
  let tmpDir: string;

  beforeAll(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'm14-preview-'));
  });

  afterAll(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('duplicate rows wali CSV preview me duplicateRows warning deta hai', async () => {
    const file = path.join(tmpDir, 'dup.csv');
    await writeFile(file, 'name,email,phone\nAcme,a@t.com,1234567890\nBeta,b@t.com,1234567891\nAcme,a@t.com,1234567890\n');

    const preview = await ImportService.previewFile(file, 'csv');

    expect(preview.totalRows).toBe(3);
    expect(preview.duplicateRows?.count).toBe(1);
    expect(preview.duplicateRows?.rowNumbers).toEqual([3]);
  });

  it('unique rows wali CSV me koi duplicate warning nahi', async () => {
    const file = path.join(tmpDir, 'uniq.csv');
    await writeFile(file, 'name,email,phone\nAcme,a@t.com,1234567890\nBeta,b@t.com,1234567891\n');

    const preview = await ImportService.previewFile(file, 'csv');

    expect(preview.duplicateRows?.count).toBe(0);
  });
});
