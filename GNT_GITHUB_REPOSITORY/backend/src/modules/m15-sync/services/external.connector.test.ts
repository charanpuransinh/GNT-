// M15 — external connector (FILE source) — unit tests (no network, no API)
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, writeFile, rm } from 'fs/promises';
import os from 'os';
import path from 'path';
import { fetchExternalEntities } from './external.connector';

describe('M15 external connector — FILE source (koi API nahi)', () => {
  let tmpDir: string;

  beforeAll(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'm15-file-'));
  });

  afterAll(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('uploaded CSV ke rows external data ban jate hain', async () => {
    const file = path.join(tmpDir, 'ext.csv');
    await writeFile(file, 'name,gstin\nAcme,27ABCDE1234F1Z5\nBeta,27BCDEF5678G2Z6\n');

    const rows = await fetchExternalEntities(
      { sourceSystem: 'FILE', connectionConfig: { fileKey: file, fileType: 'csv' } },
      { externalEntity: 'Ledger' },
      'tenant-1'
    );

    expect(rows.length).toBe(2);
    expect(rows[0].name).toBe('Acme');
    expect(rows[0].gstin).toBe('27ABCDE1234F1Z5');
    expect(rows[1].name).toBe('Beta');
  });

  it('fileKey na ho toh honest [] (koi crash nahi)', async () => {
    const rows = await fetchExternalEntities(
      { sourceSystem: 'FILE', connectionConfig: {} },
      { externalEntity: 'Ledger' },
      'tenant-1'
    );
    expect(rows).toEqual([]);
  });

  it('API source (Tally/Zoho) ab unsupported — saaf error (chupchap 0-sync nahi)', async () => {
    await expect(
      fetchExternalEntities(
        { sourceSystem: 'TALLY', connectionConfig: { integrationCode: 't1' } },
        { externalEntity: 'Ledger' },
        'tenant-1'
      )
    ).rejects.toThrow(/API connector hata diya gaya hai/);

    await expect(
      fetchExternalEntities(
        { sourceSystem: 'ZOHO', connectionConfig: { integrationCode: 'z1' } },
        { externalEntity: 'contacts' },
        'tenant-1'
      )
    ).rejects.toThrow(/sourceSystem=FILE/);
  });

  it('bina externalEntity ke [] deta hai', async () => {
    const rows = await fetchExternalEntities(
      { sourceSystem: 'FILE', connectionConfig: { fileKey: 'x.csv' } },
      { externalEntity: undefined },
      'tenant-1'
    );
    expect(rows).toEqual([]);
  });
});
