import { describe, it, expect } from 'vitest';
import { ExportService } from '../services/export.service';

describe.runIf(process.env.TEST_DB === '1')(
'Export Service', () => {
  it('should create export job', async () => {
    const job = await ExportService.createJob({
      tenantId: 'test-tenant',
      name: 'test_export',
      format: 'csv',
      sourceEntity: 'product',
      createdBy: 'test-user'
    });

    expect(job).toBeDefined();
    expect(job.name).toBe('test_export');
  });
});
