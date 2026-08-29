import React, { useState, useEffect } from 'react';
import { DragDropUploader } from '../components/DragDropUploader';
import { FieldMapper } from '../components/FieldMapper';
import { PreviewGrid } from '../components/PreviewGrid';
import { ProgressTracker } from '../components/ProgressTracker';
import { useImportExport } from '../hooks/useImportExport';
import { useImportExportStore } from '../store/importExportStore';
import { FieldMapping } from '../types/importExport.types';

const TARGET_FIELDS = ['name', 'email', 'phone', 'price', 'sku', 'quantity', 'description', 'address', 'city', 'country', 'status', 'created_at'];

export const ImportPage: React.FC = () => {
  const [step, setStep] = useState<'upload' | 'preview' | 'mapping' | 'processing'>('upload');
  const [selectedEntity, setSelectedEntity] = useState('product');
  const { uploadFile, previewImport, processImport, pollJobStatus } = useImportExport();
  const store = useImportExportStore();

  const handleFileSelect = async (file: File) => {
    try {
      const job = await uploadFile(file, selectedEntity, 'tenant-1');
      const preview = await previewImport(job.jobId);
      store.setImportPreview(preview);
      store.setFieldMapping(preview.suggestedMapping);
      setStep('preview');
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartImport = async () => {
    const job = store.currentImportJob;
    if (!job) return;
    setStep('processing');
    await processImport(job.id, store.fieldMapping);
    pollJobStatus(job.id, 'import');
  };

  const currentJob = store.currentImportJob;
  const progress = currentJob?.totalRows > 0
    ? (currentJob.processedRows / currentJob.totalRows) * 100
    : 0;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">📥 Import Data</h1>
        <select
          value={selectedEntity}
          onChange={(e) => setSelectedEntity(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="product">Products</option>
          <option value="customer">Customers</option>
          <option value="invoice">Invoices</option>
          <option value="order">Orders</option>
        </select>
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <DragDropUploader onFileSelect={handleFileSelect} />
      )}

      {/* Step 2: Preview */}
      {step === 'preview' && store.importPreview && (
        <div className="space-y-6">
          <PreviewGrid
            headers={store.importPreview.headers}
            rows={store.importPreview.rows}
            totalRows={store.importPreview.totalRows}
          />
          <div className="flex justify-between">
            <button
              onClick={() => setStep('upload')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep('mapping')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Configure Mapping →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Field Mapping */}
      {step === 'mapping' && (
        <div className="space-y-6">
          <FieldMapper
            headers={store.importPreview?.headers || []}
            mapping={store.fieldMapping}
            onMappingChange={store.setFieldMapping}
            targetFields={TARGET_FIELDS}
          />
          <div className="flex justify-between">
            <button
              onClick={() => setStep('preview')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              ← Back
            </button>
            <button
              onClick={handleStartImport}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
            >
              🚀 Start Import
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Processing */}
      {step === 'processing' && currentJob && (
        <div className="space-y-6">
          <ProgressTracker
            status={currentJob.status}
            progress={progress}
            totalRows={currentJob.totalRows}
            processedRows={currentJob.processedRows}
            successRows={currentJob.successRows}
            failedRows={currentJob.failedRows}
            fileName={currentJob.fileName}
          />
          {['COMPLETED', 'FAILED'].includes(currentJob.status) && (
            <div className="text-center">
              <button
                onClick={() => setStep('upload')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Import Another File
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
