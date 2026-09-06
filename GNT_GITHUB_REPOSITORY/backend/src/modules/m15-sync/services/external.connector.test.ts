// M15 — external connector (Tally/Zoho/File) — pure unit tests (no network)
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, writeFile, rm } from 'fs/promises';
import os from 'os';
import path from 'path';
import {
  buildTallyRequest,
  parseTallyResponse,
  buildZohoRequest,
  fetchExternalEntities,
} from './external.connector';

const TALLY_RESPONSE = `<?xml version="1.0"?>
<ENVELOPE>
  <HEADER><TALLYREQUEST>Export</TALLYREQUEST></HEADER>
  <BODY>
    <DATA>
      <COLLECTION>
        <LEDGER NAME="Cash"><OPENINGBALANCE>1000</OPENINGBALANCE><PARENT>Sundry</PARENT></LEDGER>
        <LEDGER NAME="Bank"><OPENINGBALANCE>2000</OPENINGBALANCE></LEDGER>
      </COLLECTION>
    </DATA>
  </BODY>
</ENVELOPE>`;

describe('M15 external connector (pure)', () => {
  it('buildTallyRequest sahi XML envelope banata hai', () => {
    const xml = buildTallyRequest('Ledger');
    expect(xml).toContain('<ID>Ledger</ID>');
    expect(xml).toContain('<TALLYREQUEST>Export</TALLYREQUEST>');
    expect(xml).toContain('<TYPE>Collection</TYPE>');
  });

  it('buildTallyRequest entity me se illegal chars nikal deta hai', () => {
    expect(buildTallyRequest('Stock Item<X>')).toContain('<ID>StockItemX</ID>');
  });

  it('parseTallyResponse collection records nikalta hai (attribute + child merge)', () => {
    const records = parseTallyResponse(TALLY_RESPONSE, 'Ledger');
    expect(records.length).toBe(2);
    expect(records[0].NAME).toBe('Cash');
    expect(records[0].OPENINGBALANCE).toBe('1000');
    expect(records[1].NAME).toBe('Bank');
    expect(records[1].OPENINGBALANCE).toBe('2000');
  });

  it('parseTallyResponse malformed XML par [] deta hai (crash nahi)', () => {
    expect(parseTallyResponse('not-xml', 'Ledger')).toEqual([]);
  });

  it('buildZohoRequest sahi URL + headers banata hai', () => {
    const { url, headers } = buildZohoRequest('https://books.zoho.com/', 'contacts', 'org123');
    expect(url).toBe('https://books.zoho.com/books/v3/contacts?organization_id=org123');
    expect(headers.Accept).toBe('application/json');
  });

  it('buildZohoRequest bina organization_id ke bhi kaam karta hai', () => {
    const { url } = buildZohoRequest('https://books.zoho.com', 'items');
    expect(url).toBe('https://books.zoho.com/books/v3/items');
  });

  it('fetchExternalEntities bina integration config ke honest [] deta hai (koi fake nahi)', async () => {
    const out = await fetchExternalEntities(
      { sourceSystem: 'TALLY', connectionConfig: null },
      { externalEntity: 'Ledger' },
      'tenant-1'
    );
    expect(out).toEqual([]);
  });

  it('fetchExternalEntities bina externalEntity ke [] deta hai', async () => {
    const out = await fetchExternalEntities(
      { sourceSystem: 'ZOHO', connectionConfig: { integrationCode: 'z1' } },
      { externalEntity: undefined },
      'tenant-1'
    );
    expect(out).toEqual([]);
  });
});

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
});
