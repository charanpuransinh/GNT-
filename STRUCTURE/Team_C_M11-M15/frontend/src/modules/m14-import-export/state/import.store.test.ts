// M14 Frontend — Import Store Tests
// Lock: LOCK_12_TESTS
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useImportStore } from '../src/stores/import.store';
import { importApi } from '../src/api';

vi.mock('../src/api', () => ({
  importApi: {
    upload: vi.fn(),
    getJob: vi.fn(),
    listJobs: vi.fn(),
    cancel: vi.fn(),
    retry: vi.fn(),
  },
}));

describe('Import Store', () => {
  beforeEach(() => {
    useImportStore.setState({
      jobs: [], currentJob: null, validation: null,
      isLoading: false, error: null, uploadProgress: 0,
    });
  });

  it('should set loading on upload', async () => {
    (importApi.upload as any).mockResolvedValue({ jobId: '123' });
    const store = useImportStore.getState();

    store.uploadFile({
      file: new File(['test'], 'test.csv', { type: 'text/csv' }),
      module: 'M05', entityType: 'product',
    });

    expect(useImportStore.getState().isLoading).toBe(true);
  });

  it('should store jobs after fetch', async () => {
    const mockJobs = [{ id: '1', status: 'COMPLETED', module: 'M05', entityType: 'product' }];
    (importApi.listJobs as any).mockResolvedValue(mockJobs);

    await useImportStore.getState().fetchJobs();
    expect(useImportStore.getState().jobs).toEqual(mockJobs);
    expect(useImportStore.getState().isLoading).toBe(false);
  });

  it('should clear error', () => {
    useImportStore.setState({ error: 'Some error' });
    useImportStore.getState().clearError();
    expect(useImportStore.getState().error).toBeNull();
  });
});
