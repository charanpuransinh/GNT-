// M14 — Export Service Tests
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { ExportService } from '../src/services/export.service';
import { FormatterService } from '../src/services/formatter.service';

const prisma = new PrismaClient();
const exportService = new ExportService();
const formatterService = new FormatterService();

describe('M14 Export Service', () => {
  const tenantId = 'test-tenant';
  const userId = 'test-user';

  beforeAll(async () => {
    await prisma.exportJob.deleteMany({ where: { tenantId } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create an export job', async () => {
    const jobId = await exportService.createExportJob({
      module: 'M05', entityType: 'product', format: 'csv',
      tenantId, userId,
    });
    expect(jobId).toBeDefined();
    const job = await exportService.getExportJob(jobId, tenantId);
    expect(job.status).toBe('PENDING');
  });

  it('should format data to CSV', async () => {
    const data = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }];
    const buf = await formatterService.toCSV(data);
    const str = buf.toString();
    expect(str).toContain('id,name');
    expect(str).toContain('1,A');
  });

  it('should format data to JSON', async () => {
    const data = [{ id: 1 }];
    const buf = await formatterService.toJSON(data);
    const parsed = JSON.parse(buf.toString());
    expect(parsed).toEqual(data);
  });

  it('should cancel pending export', async () => {
    const jobId = await exportService.createExportJob({
      module: 'M05', entityType: 'product', format: 'xlsx', tenantId, userId,
    });
    await exportService.cancelExportJob(jobId, tenantId);
    const job = await exportService.getExportJob(jobId, tenantId);
    expect(job.status).toBe('CANCELLED');
  });
});
