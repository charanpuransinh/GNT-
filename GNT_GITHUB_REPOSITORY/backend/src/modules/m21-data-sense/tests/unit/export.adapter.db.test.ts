// ============================================================================
// M21 — Data Sense TRANSFER (DB-gated) — export sheet → M20 trade_job
// party/product resolve + M20 createExportShipment (adapter mera)
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/common/config/prisma';
import { dataSenseService } from '../../services/dataSense.service';

const EXPORT_COMPANY = '00000000-0000-4000-8000-000000000097';

const exportSheet = {
  sheetName: 'exports.csv',
  headers: ['InvoiceNo', 'Buyer', 'HSN', 'Currency', 'Qty', 'Product', 'FOBValue'],
  rows: [
    { InvoiceNo: 'EXP-M21-TEST-1', Buyer: 'Overseas Buyer LLC', HSN: '84713010', Currency: 'INR', Qty: '5', Product: 'Laptop', FOBValue: '10000' },
  ],
};

async function cleanup() {
  await prisma.trade_job.deleteMany({ where: { company_id: EXPORT_COMPANY } });
  await prisma.party_master.deleteMany({ where: { company_id: EXPORT_COMPANY } });
  await prisma.product_master.deleteMany({ where: { company_id: EXPORT_COMPANY } });
}

describe.runIf(process.env.TEST_DB === '1')('M21 export adapter — live DB', () => {
  beforeAll(async () => {
    await prisma.company_master.upsert({
      where: { id: EXPORT_COMPANY },
      update: { name: 'Export Co' },
      create: { id: EXPORT_COMPANY, name: 'Export Co', code: 'EXPCO' },
    });
    // valid 8-digit HSN — M20 createExportShipment validateHSN के लिए ज़रूरी
    await prisma.customs_tariff.upsert({
      where: { code: '84713010' },
      update: {},
      create: {
        code: '84713010', description: 'Laptop', chapter: '84', heading: '8471',
        subheading: '847130', tariff_item: '84713010', gst_rate: 18, igst_rate: 18, cess_rate: 0, is_active: true,
      },
    });
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
  });

  it('export sheet → M20 trade_job बनता है (party/product resolve होकर)', async () => {
    const result = await dataSenseService.transfer(EXPORT_COMPANY, exportSheet);

    expect(result.sense.group).toBe('export');
    expect(result.blocked).toBe(false);
    expect(result.transferred).not.toBeNull();
    expect(result.transferred!.summary.created).toBe(1);

    const job = await prisma.trade_job.findFirst({ where: { company_id: EXPORT_COMPANY, reference_no: 'EXP-M21-TEST-1' } });
    expect(job).toBeTruthy();
    expect(job!.type).toBe('export');
    expect(job!.hsn_code).toBe('84713010');
    expect(Number(job!.quantity)).toBe(5);

    // party/product resolve होकर बने
    const party = await prisma.party_master.findFirst({ where: { company_id: EXPORT_COMPANY } });
    expect(party).toBeTruthy();
    expect(party!.name).toBe('Overseas Buyer LLC');
    const product = await prisma.product_master.findFirst({ where: { company_id: EXPORT_COMPANY } });
    expect(product).toBeTruthy();
  });
});
