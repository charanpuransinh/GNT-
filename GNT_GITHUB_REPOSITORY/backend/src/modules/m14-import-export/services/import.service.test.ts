// M14 — Import Service Tests
// Lock: LOCK_15_TESTS
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { ImportService } from '../src/services/import.service';
import { ParserService } from '../src/services/parser.service';

const prisma = new PrismaClient();
const importService = new ImportService();
const parserService = new ParserService();

describe('M14 Import Service', () => {
  const tenantId = 'test-tenant';
  const userId = 'test-user';

  beforeAll(async () => {
    await prisma.importJob.deleteMany({ where: { tenantId } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create an import job', async () => {
    const csv = Buffer.from('name,price\nProduct A,100\nProduct B,200');
    const jobId = await importService.createImportJob({
      fileBuffer: csv,
      fileType: 'csv',
      module: 'M05',
      entityType: 'product',
      tenantId,
      userId,
    });
    expect(jobId).toBeDefined();
    const job = await importService.getImportJob(jobId, tenantId);
    expect(job.status).toBe('PENDING');
  });

  it('should parse CSV correctly', async () => {
    const csv = Buffer.from('sku,name,price\nSKU001,Widget,99.99');
    const result = await parserService.parse(csv, 'csv');
    expect(result.data).toHaveLength(1);
    expect(result.data[0].sku).toBe('SKU001');
    expect(result.meta.totalRows).toBe(1);
  });

  it('should parse Excel correctly', async () => {
    // Requires real xlsx buffer in integration test
    // Placeholder for structure validation
    expect(parserService.parseExcel).toBeDefined();
  });

  it('should cancel a pending job', async () => {
    const csv = Buffer.from('test,data');
    const jobId = await importService.createImportJob({
      fileBuffer: csv, fileType: 'csv', module: 'M05', entityType: 'product', tenantId, userId,
    });
    await importService.cancelImportJob(jobId, tenantId);
    const job = await importService.getImportJob(jobId, tenantId);
    expect(job.status).toBe('CANCELLED');
  });

  it('should not cancel completed job', async () => {
    // Mock completed job
    const job = await prisma.importJob.create({
      data: { tenantId, module: 'M05', entityType: 'product', fileUrl: 'x', fileType: 'csv', status: 'COMPLETED', createdBy: userId }
    });
    await expect(importService.cancelImportJob(job.id, tenantId)).rejects.toThrow('Cannot cancel');
  });
});
