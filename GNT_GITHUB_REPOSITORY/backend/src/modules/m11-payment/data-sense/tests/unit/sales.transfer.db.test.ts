import { prisma } from '@/common/config/prisma';
// M21 — Sales transfer END-TO-END: sales sheet → M08 sales_invoice (asli create)
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { dataSenseService } from '../../services/dataSense.service';

const COMPANY_ID = '00000000-0000-4000-8000-000000000090';

const salesSheet = {
  sheetName: 'sales.csv',
  headers: [
    'InvoiceNo',
    'InvoiceDate',
    'Party',
    'TaxableValue',
    'GstAmount',
    'InvoiceTotal',
    'HSN',
  ],
  rows: [
    {
      InvoiceNo: 'SAL-E2E-1',
      InvoiceDate: '2026-01-10',
      Party: 'Sales Buyer',
      TaxableValue: '1000',
      GstAmount: '180',
      InvoiceTotal: '1180',
      HSN: '84713010',
    },
  ],
};

async function cleanup() {
  await prisma.salesInvoiceItem.deleteMany({ where: { salesInvoice: { companyId: COMPANY_ID } } });
  await prisma.salesInvoice.deleteMany({ where: { companyId: COMPANY_ID } });
  await prisma.party_master.deleteMany({ where: { company_id: COMPANY_ID } });
}

describe.runIf(process.env.TEST_DB === '1')('M21 sales transfer — live DB', () => {
  beforeAll(async () => {
    await cleanup();
    await prisma.company_master.upsert({
      where: { id: COMPANY_ID },
      update: { name: 'Sales Co' },
      create: { id: COMPANY_ID, name: 'Sales Co', code: 'SALCO' },
    });
  });
  afterAll(cleanup);

  it('sales sheet → M08 sales_invoice + item + party banta hai', async () => {
    const result = await dataSenseService.transfer(COMPANY_ID, salesSheet);

    expect(result.sense.group).toBe('sales');
    expect(result.transferred).not.toBeNull();
    expect(result.transferred!.summary.created).toBe(1);

    const invoice = await prisma.salesInvoice.findFirst({ where: { companyId: COMPANY_ID } });
    expect(invoice).toBeTruthy();
    expect(Number(invoice!.grandTotal)).toBe(1180);

    const party = await prisma.party_master.findFirst({ where: { company_id: COMPANY_ID } });
    expect(party).toBeTruthy();
    expect(party!.name).toBe('Sales Buyer');
  });
});
