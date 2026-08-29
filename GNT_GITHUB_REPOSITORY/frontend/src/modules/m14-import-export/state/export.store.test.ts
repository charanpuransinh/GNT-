// M14 Frontend — Export Store Tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useExportStore } from '../src/stores/export.store';
import { exportApi } from '../src/api';

vi.mock('../src/api', () => ({
  exportApi: {
    create: vi.fn(),
    getJob: vi.fn(),
    listJobs: vi.fn(),
    cancel: vi.fn(),
    download: vi.fn(),
  },
}));

describe('Export Store', () => {
  beforeEach(() => {
    useExportStore.setState({
      jobs: [], currentJob: null,
      isLoading: false, error: null, downloadUrl: null,
    });
  });

  it('should create export job', async () => {
    (exportApi.create as any).mockResolvedValue({ jobId: 'exp-123' });
    const jobId = await useExportStore.getState().createExport({
      module: 'M05', entityType: 'product', format: 'CSV',
    });
    expect(jobId).toBe('exp-123');
  });

  it('should track download URL', () => {
    useExportStore.setState({ downloadUrl: 'blob:http://test' });
    expect(useExportStore.getState().downloadUrl).toBe('blob:http://test');
  });
});
