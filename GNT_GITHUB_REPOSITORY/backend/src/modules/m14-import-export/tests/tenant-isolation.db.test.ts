// ============================================================================
// M14 — tenant isolation (DB-gated) — Import/Export jobs दूसरी company से सुरक्षित
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/common/config/prisma';
import { ImportService } from '../services/import.service';
import { ExportService } from '../services/export.service';
import { TEST_COMPANY_ID, TEST_USER_ID } from '@/tests/helpers/auth';

const OTHER_COMPANY_ID = '00000000-0000-4000-8000-000000000099';

async function cleanup() {
  await prisma.importJob.deleteMany({ where: { tenantId: { in: [TEST_COMPANY_ID, OTHER_COMPANY_ID] } } });
  await prisma.exportJob.deleteMany({ where: { tenantId: { in: [TEST_COMPANY_ID, OTHER_COMPANY_ID] } } });
}

describe.runIf(process.env.TEST_DB === '1')('M14 tenant isolation — live DB', () => {
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

  it('import job — दूसरी company पढ़ न पाए (getJobStatus null)', async () => {
    const job = await ImportService.createJob({
      tenantId: TEST_COMPANY_ID,
      fileName: 'x.csv',
      fileType: 'csv',
      fileSize: 10,
      filePath: 'uploads/imports/x.csv',
      entityType: 'ITEM',
      createdBy: TEST_USER_ID,
    });

    expect(await ImportService.getJobStatus(job.id, TEST_COMPANY_ID)).not.toBeNull();
    expect(await ImportService.getJobStatus(job.id, OTHER_COMPANY_ID)).toBeNull();
  });

  it('import job — दूसरी company cancel न कर पाए', async () => {
    const job = await ImportService.createJob({
      tenantId: TEST_COMPANY_ID,
      fileName: 'y.csv',
      fileType: 'csv',
      fileSize: 10,
      filePath: 'uploads/imports/y.csv',
      entityType: 'ITEM',
      createdBy: TEST_USER_ID,
    });

    await expect(ImportService.cancelJob(job.id, OTHER_COMPANY_ID)).rejects.toThrow();
    const still = await ImportService.getJobStatus(job.id, TEST_COMPANY_ID);
    expect(still).not.toBeNull();
    expect(still!.status).not.toBe('CANCELLED');
  });

  it('export job — दूसरी company पढ़ न पाए', async () => {
    const job = await ExportService.createJob({
      tenantId: TEST_COMPANY_ID,
      name: 'export.csv',
      format: 'csv',
      sourceEntity: 'INVOICE',
      createdBy: TEST_USER_ID,
    });

    expect(await ExportService.getJobStatus(job.id, TEST_COMPANY_ID)).not.toBeNull();
    expect(await ExportService.getJobStatus(job.id, OTHER_COMPANY_ID)).toBeNull();
  });

  it('export job — दूसरी company cancel न कर पाए', async () => {
    const job = await ExportService.createJob({
      tenantId: TEST_COMPANY_ID,
      name: 'export2.csv',
      format: 'csv',
      sourceEntity: 'INVOICE',
      createdBy: TEST_USER_ID,
    });

    await expect(ExportService.cancelJob(job.id, OTHER_COMPANY_ID)).rejects.toThrow();
    const still = await ExportService.getJobStatus(job.id, TEST_COMPANY_ID);
    expect(still).not.toBeNull();
    expect(still!.status).not.toBe('CANCELLED');
  });
});
