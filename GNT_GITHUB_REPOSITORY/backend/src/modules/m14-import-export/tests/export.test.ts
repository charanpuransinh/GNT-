import { describe, it, expect } from 'vitest';
import { ExportService } from '../services/export.service';

describe('Export Service', () => {
  it('should create export job', async () => {
    const job = await ExportService.createJob({
      tenantId: 'test-tenant',
      fileName: 'test_export',
      fileType: 'csv',
      entityType: 'product',
      createdBy: 'test-user'
    });

    expect(job).toBeDefined();
    expect(job.status).toBe('PENDING');
    expect(job.entityType).toBe('product');
  });
});
