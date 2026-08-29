import { useState, useCallback } from 'react';
import { useImportExportStore } from '../store/importExportStore';
import { ImportJob, ExportJob, FieldMapping, ExportConfig } from '../types/importExport.types';

const API_BASE = '/api/m14';

export const useImportExport = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const store = useImportExportStore();

  const uploadFile = useCallback(async (file: File, entityType: string, tenantId: string) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', entityType);
      formData.append('tenantId', tenantId);

      const res = await fetch(`${API_BASE}/imports/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      store.setCurrentImportJob(data.data);
      return data.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [store]);

  const previewImport = useCallback(async (jobId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/imports/preview/${jobId}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      store.setImportPreview(data.data);
      store.setFieldMapping(data.data.suggestedMapping);
      return data.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [store]);

  const processImport = useCallback(async (jobId: string, fieldMapping: FieldMapping[]) => {
    setLoading(true);
    store.setIsImporting(true);
    try {
      const res = await fetch(`${API_BASE}/imports/process/${jobId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldMapping })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      return data.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [store]);

  const createExport = useCallback(async (config: ExportConfig, tenantId: string) => {
    setLoading(true);
    store.setIsExporting(true);
    try {
      const res = await fetch(`${API_BASE}/exports/create?tenantId=${tenantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      store.setCurrentExportJob(data.data);
      return data.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [store]);

  const fetchImportJobs = useCallback(async (tenantId: string) => {
    try {
      const res = await fetch(`${API_BASE}/imports/jobs?tenantId=${tenantId}`);
      const data = await res.json();
      if (data.success) store.setImportJobs(data.data);
    } catch (err: any) {
      setError(err.message);
    }
  }, [store]);

  const fetchExportJobs = useCallback(async (tenantId: string) => {
    try {
      const res = await fetch(`${API_BASE}/exports/jobs?tenantId=${tenantId}`);
      const data = await res.json();
      if (data.success) store.setExportJobs(data.data);
    } catch (err: any) {
      setError(err.message);
    }
  }, [store]);

  const pollJobStatus = useCallback(async (jobId: string, type: 'import' | 'export') => {
    const endpoint = type === 'import' 
      ? `${API_BASE}/imports/status/${jobId}`
      : `${API_BASE}/exports/status/${jobId}`;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(endpoint);
        const data = await res.json();
        if (data.success) {
          if (type === 'import') {
            store.updateImportJob(data.data);
            const progress = data.data.totalRows > 0 
              ? (data.data.processedRows / data.data.totalRows) * 100 
              : 0;
            store.setImportProgress(progress);
            if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(data.data.status)) {
              store.setIsImporting(false);
              clearInterval(interval);
            }
          } else {
            store.updateExportJob(data.data);
            if (['COMPLETED', 'FAILED', 'EXPIRED'].includes(data.data.status)) {
              store.setIsExporting(false);
              clearInterval(interval);
            }
          }
        }
      } catch (err) {
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [store]);

  return {
    loading,
    error,
    uploadFile,
    previewImport,
    processImport,
    createExport,
    fetchImportJobs,
    fetchExportJobs,
    pollJobStatus
  };
};
