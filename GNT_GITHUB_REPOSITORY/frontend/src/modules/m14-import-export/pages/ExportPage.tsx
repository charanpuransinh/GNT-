import React, { useState } from 'react';
import { ExportFormatSelector } from '../components/ExportFormatSelector';
import { ProgressTracker } from '../components/ProgressTracker';
import { useImportExport } from '../hooks/useImportExport';
import { useImportExportStore } from '../store/importExportStore';
import { ExportConfig } from '../types/importExport.types';

const ENTITY_FIELDS: Record<string, string[]> = {
  product: ['id', 'name', 'sku', 'price', 'quantity', 'description', 'category', 'status', 'created_at'],
  customer: ['id', 'name', 'email', 'phone', 'address', 'city', 'country', 'status', 'created_at'],
  invoice: ['id', 'invoice_number', 'customer_name', 'amount', 'status', 'due_date', 'created_at'],
  order: ['id', 'order_number', 'customer_name', 'total_amount', 'status', 'created_at']
};

export const ExportPage: React.FC = () => {
  const [selectedEntity, setSelectedEntity] = useState('product');
  const [config, setConfig] = useState<ExportConfig>({
    entityType: 'product',
    format: 'csv',
    columns: ENTITY_FIELDS['product']
  });

  const { createExport, pollJobStatus } = useImportExport();
  const store = useImportExportStore();

  const handleEntityChange = (entity: string) => {
    setSelectedEntity(entity);
    setConfig({
      ...config,
      entityType: entity,
      columns: ENTITY_FIELDS[entity]
    });
  };

  const handleExport = async () => {
    const job = await createExport(config, 'tenant-1');
    pollJobStatus(job.jobId, 'export');
  };

  const currentJob = store.currentExportJob;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">📤 Export Data</h1>
        <select
          value={selectedEntity}
          onChange={(e) => handleEntityChange(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="product">Products</option>
          <option value="customer">Customers</option>
          <option value="invoice">Invoices</option>
          <option value="order">Orders</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <ExportFormatSelector
          config={config}
          onChange={setConfig}
          entityFields={ENTITY_FIELDS[selectedEntity]}
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleExport}
          disabled={config.columns.length === 0 || store.isExporting}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {store.isExporting ? '⏳ Exporting...' : '📥 Generate Export'}
        </button>
      </div>

      {currentJob && (
        <ProgressTracker
          status={currentJob.status}
          progress={store.exportProgress}
          totalRows={currentJob.totalRows}
          processedRows={currentJob.totalRows}
          fileName={currentJob.fileName}
          fileUrl={currentJob.fileUrl}
        />
      )}
    </div>
  );
};
