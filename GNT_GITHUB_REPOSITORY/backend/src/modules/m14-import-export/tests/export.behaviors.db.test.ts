import { readFileSync } from 'node:fs';
import { prisma } from '@/common/config/prisma';
// M14 — Export service behaviours: real PDF, invoice entity, honest failure on unknown entity
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ExportService } from '../services/export.service';

const COMPANY_ID = '00000000-0000-4000-8000-0000000000e1';
const USER_ID = '00000000-0000-4000-8000-0000000000e2';

async function cleanup() {
  await prisma.exportJob.deleteMany({ where: { tenantId: COMPANY_ID } });
  await prisma.salesInvoice.deleteMany({ where: { companyId: COMPANY_ID } });
  await prisma.party_master.deleteMany({ where: { company_id: COMPANY_ID } });
}

describe.runIf(process.env.TEST_DB === '1')('M14 export behaviours — live DB', () => {
  beforeAll(async () => {
    await prisma.company_master.upsert({
      where: { id: COMPANY_ID },
      update: {},
      create: { id: COMPANY_ID, name: 'ExpBeh Co', code: 'EXPBEH-1' },
    });
    await cleanup();
    await prisma.party_master.create({
      data: {
        company_id: COMPANY_ID,
        party_type: 'customer',
        name: 'PDF Party',
        email: 'pdf@test.com',
      },
    });
  });
  afterAll(cleanup);

  it('PDF export writes a real PDF file (starts with %PDF-), not JSON', async () => {
    const job = await ExportService.createJob({
      tenantId: COMPANY_ID,
      name: 'p.pdf',
      format: 'pdf',
      sourceEntity: 'customer',
      columns: [
        { field: 'name', header: 'Name' },
        { field: 'email', header: 'Email' },
      ] as unknown[],
      createdBy: USER_ID,
    });
    await ExportService.processJob(job.id, COMPANY_ID);

    const done = await prisma.exportJob.findUnique({ where: { id: job.id } });
    expect(done!.status).toBe('COMPLETED');
    const head = readFileSync(done!.fileKey!).subarray(0, 5).toString('latin1');
    expect(head).toBe('%PDF-');
  });

  it('invoice entity exports real SalesInvoice rows', async () => {
    const inv = await prisma.salesInvoice.create({
      data: {
        companyId: COMPANY_ID,
        branchId: 'b1',
        customerId: 'c1',
        invoiceNumber: 'INV-EXPBEH-1',
        invoiceDate: new Date('2026-09-01'),
        dueDate: new Date('2026-09-30'),
        totalAmount: 100,
        totalTax: 18,
        totalDiscount: 0,
        netAmount: 100,
        roundOff: 0,
        grandTotal: 118,
      },
    });
    const job = await ExportService.createJob({
      tenantId: COMPANY_ID,
      name: 'i.csv',
      format: 'csv',
      sourceEntity: 'invoice',
      createdBy: USER_ID,
    });
    await ExportService.processJob(job.id, COMPANY_ID);

    const done = await prisma.exportJob.findUnique({ where: { id: job.id } });
    expect(done!.status).toBe('COMPLETED');
    expect(done!.totalRecords).toBe(1);
    await prisma.salesInvoice.delete({ where: { id: inv.id } });
  });

  it('unknown entity => job FAILED with a clear error, no fake COMPLETED', async () => {
    const job = await ExportService.createJob({
      tenantId: COMPANY_ID,
      name: 'x.csv',
      format: 'csv',
      sourceEntity: 'GLERP_THINGS',
      createdBy: USER_ID,
    });
    await expect(ExportService.processJob(job.id, COMPANY_ID)).rejects.toThrow(
      /Unsupported export entity/
    );

    const done = await prisma.exportJob.findUnique({ where: { id: job.id } });
    expect(done!.status).toBe('FAILED');
  });

  it('export pages past 1000 rows — full dataset, not silently capped', async () => {
    const N = 1250; // > ExportService.PAGE (1000): forces the cursor loop
    await prisma.party_master.createMany({
      data: Array.from({ length: N }, (_, i) => ({
        company_id: COMPANY_ID,
        party_type: 'customer',
        name: `Bulk Party ${String(i).padStart(4, '0')}`,
      })),
    });
    const total = await prisma.party_master.count({ where: { company_id: COMPANY_ID } });

    const job = await ExportService.createJob({
      tenantId: COMPANY_ID,
      name: 'bulk.csv',
      format: 'csv',
      sourceEntity: 'customer',
      createdBy: USER_ID,
    });
    await ExportService.processJob(job.id, COMPANY_ID);

    const done = await prisma.exportJob.findUnique({ where: { id: job.id } });
    expect(done!.status).toBe('COMPLETED');
    expect(done!.totalRecords).toBe(total); // old `take: 500` would report 500
    expect(total).toBeGreaterThan(1000);
  });
});
