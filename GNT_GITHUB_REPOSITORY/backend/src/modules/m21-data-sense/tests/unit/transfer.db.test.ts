// ============================================================================
// M21 — Data Sense TRANSFER (DB-gated) — party sheet → M05, tenant-scoped
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/common/config/prisma';
import { dataSenseService } from '../../services/dataSense.service';
import { TEST_COMPANY_ID } from '@/tests/helpers/auth';

const OTHER_COMPANY_ID = '00000000-0000-4000-8000-000000000099';

const partySheet = {
  sheetName: 'parties.csv',
  headers: ['Name', 'GSTIN', 'Phone', 'Email'],
  rows: [
    { Name: 'Acme Traders', GSTIN: '27ABCDE1234F1Z5', Phone: '9876543210', Email: 'acme@test.com' },
    { Name: 'Beta Suppliers', GSTIN: '27XYZAB5678C1Z6', Phone: '9123456780', Email: 'beta@test.com' },
  ],
};

async function cleanup() {
  await prisma.party_master.deleteMany({ where: { company_id: { in: [TEST_COMPANY_ID, OTHER_COMPANY_ID] } } });
}

describe.runIf(process.env.TEST_DB === '1')('M21 Data Sense TRANSFER — live DB', () => {
  beforeAll(async () => {
    await prisma.company_master.upsert({
      where: { id: TEST_COMPANY_ID },
      update: { name: 'Test Company' },
      create: { id: TEST_COMPANY_ID, name: 'Test Company', code: 'TESTCO' },
    });
    await prisma.company_master.upsert({
      where: { id: OTHER_COMPANY_ID },
      update: { name: 'Other Company' },
      create: { id: OTHER_COMPANY_ID, name: 'Other Company', code: 'OTHERCO' },
    });
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
  });

  it('party sheet समझकर M05 में असल में डाल देता है (tenant-scoped)', async () => {
    const result = await dataSenseService.transfer(TEST_COMPANY_ID, partySheet);

    expect(result.sense.group).toBe('party');
    expect(result.importable).toBe(true);
    expect(result.blocked).toBe(false);
    expect(result.transferred).not.toBeNull();
    expect(result.transferred!.summary.created).toBe(2);

    const created = await prisma.party_master.findMany({ where: { company_id: TEST_COMPANY_ID } });
    expect(created.length).toBe(2);
    const names = created.map((p) => p.name).sort();
    expect(names).toContain('Acme Traders');
    expect(names).toContain('Beta Suppliers');
  });

  it('दूसरी company की party sheet उसी company में जाती है', async () => {
    const result = await dataSenseService.transfer(OTHER_COMPANY_ID, {
      sheetName: 'p.csv',
      headers: ['Name', 'GSTIN'],
      rows: [{ Name: 'Gamma Co', GSTIN: '29ABCDE1234F1Z9' }],
    });

    expect(result.blocked).toBe(false);
    expect(result.transferred).not.toBeNull();
    expect(result.transferred!.summary.created).toBe(1);

    // TEST company की party गिनती नहीं बढ़ी
    const testParties = await prisma.party_master.count({ where: { company_id: TEST_COMPANY_ID } });
    expect(testParties).toBe(2);

    const otherParties = await prisma.party_master.findMany({ where: { company_id: OTHER_COMPANY_ID } });
    expect(otherParties.length).toBe(1);
    expect(otherParties[0].name).toBe('Gamma Co');
  });

  it('ख़राब sheet (समझ न आए) blocked रहती है — कुछ नहीं चढ़ता', async () => {
    const before = await prisma.party_master.count({ where: { company_id: TEST_COMPANY_ID } });

    const result = await dataSenseService.transfer(TEST_COMPANY_ID, {
      sheetName: 'unknown.csv',
      headers: ['ColA', 'ColB', 'ColC'],
      rows: [{ ColA: 'x', ColB: 'y', ColC: 'z' }],
    });

    expect(result.sense.group).toBeNull();
    expect(result.importable).toBe(false);
    expect(result.blocked).toBe(true);
    expect(result.transferred).toBeNull();

    const after = await prisma.party_master.count({ where: { company_id: TEST_COMPANY_ID } });
    expect(after).toBe(before);
  });
});
