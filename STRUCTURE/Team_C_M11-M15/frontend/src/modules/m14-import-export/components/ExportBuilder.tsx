// M14 Frontend — ExportBuilder
// Lock: LOCK_06_COMPONENT
import React, { useState } from 'react';
import { useExportStore } from '../../stores/export.store';
import { ErrorAlert } from '../Common/ErrorAlert';
import { ExportPayload, ExportFormat } from '../../types';

const MODULES = ['M05', 'M06', 'M07', 'M08', 'M09', 'M10', 'M11', 'M12', 'M13'];
const FORMATS: ExportFormat[] = ['CSV', 'XLSX', 'JSON', 'PDF'];
const ENTITY_MAP: Record<string, string[]> = {
  M05: ['product', 'category', 'variant'],
  M06: ['customer', 'supplier', 'vendor'],
  M07: ['invoice', 'order', 'quotation'],
  M08: ['inventory', 'stock', 'movement'],
  M09: ['transaction', 'journal', 'ledger'],
  M10: ['account', 'budget', 'report'],
  M11: ['payment', 'receipt', 'voucher'],
  M12: ['employee', 'attendance', 'payroll'],
  M13: ['workflow', 'rule', 'trigger'],
};

interface Props {
  onExportCreated?: (jobId: string) => void;
}

export const ExportBuilder: React.FC<Props> = ({ onExportCreated }) => {
  const { createExport, isLoading, error, clearError } = useExportStore();
  const [module, setModule] = useState('');
  const [entityType, setEntityType] = useState('');
  const [format, setFormat] = useState<ExportFormat>('CSV');
  const [columns, setColumns] = useState('');
  const [filters, setFilters] = useState('{}');

  const entities = module ? ENTITY_MAP[module] || [] : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: ExportPayload = {
      module,
      entityType,
      format,
      columns: columns ? columns.split(',').map(c => c.trim()) : undefined,
      filters: filters ? JSON.parse(filters) : undefined,
    };
    try {
      const jobId = await createExport(payload);
      onExportCreated?.(jobId);
    } catch {
      // handled in store
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
      <ErrorAlert message={error} onDismiss={clearError} />
      <h3 className="text-lg font-semibold">Create Export</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Module</label>
          <select value={module} onChange={(e) => { setModule(e.target.value); setEntityType(''); }} className="w-full border rounded px-3 py-2">
            <option value="">Select Module</option>
            {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
          <select value={entityType} onChange={(e) => setEntityType(e.target.value)} className="w-full border rounded px-3 py-2" disabled={!module}>
            <option value="">Select Entity</option>
            {entities.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
        <div className="flex gap-2">
          {FORMATS.map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setFormat(f)}
              className={`px-4 py-2 rounded border text-sm font-medium transition-colors
                ${format === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Columns (comma separated, optional)</label>
        <input type="text" value={columns} onChange={(e) => setColumns(e.target.value)} placeholder="id, name, price" className="w-full border rounded px-3 py-2" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Filters (JSON, optional)</label>
        <textarea value={filters} onChange={(e) => setFilters(e.target.value)} rows={3} className="w-full border rounded px-3 py-2 font-mono text-sm" />
      </div>

      <button type="submit" disabled={isLoading || !module || !entityType} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed">
        {isLoading ? 'Creating Export...' : 'Create Export Job'}
      </button>
    </form>
  );
};
