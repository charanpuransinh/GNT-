import React from 'react';
import { ExportConfig } from '../types/importExport.types';

interface ExportFormatSelectorProps {
  config: ExportConfig;
  onChange: (config: ExportConfig) => void;
  entityFields: string[];
}

const FORMATS = [
  { value: 'csv', label: 'CSV', icon: '📄', desc: 'Comma separated values' },
  { value: 'xlsx', label: 'Excel', icon: '📊', desc: 'Microsoft Excel (.xlsx)' },
  { value: 'json', label: 'JSON', icon: '📋', desc: 'JavaScript Object Notation' },
  { value: 'pdf', label: 'PDF', icon: '📕', desc: 'Portable Document Format' }
];

export const ExportFormatSelector: React.FC<ExportFormatSelectorProps> = ({
  config,
  onChange,
  entityFields
}) => {
  const toggleColumn = (field: string) => {
    const newColumns = config.columns.includes(field)
      ? config.columns.filter((c) => c !== field)
      : [...config.columns, field];
    onChange({ ...config, columns: newColumns });
  };

  const selectAll = () => onChange({ ...config, columns: [...entityFields] });
  const deselectAll = () => onChange({ ...config, columns: [] });

  return (
    <div className="space-y-6">
      {/* Format Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Export Format</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {FORMATS.map((fmt) => (
            <button
              key={fmt.value}
              onClick={() => onChange({ ...config, format: fmt.value as any })}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                config.format === fmt.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">{fmt.icon}</div>
              <div className="font-semibold text-gray-800">{fmt.label}</div>
              <div className="text-xs text-gray-500">{fmt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Column Selection */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-medium text-gray-700">Select Columns</label>
          <div className="space-x-2">
            <button onClick={selectAll} className="text-xs text-blue-600 hover:text-blue-800">Select All</button>
            <button onClick={deselectAll} className="text-xs text-blue-600 hover:text-blue-800">Deselect All</button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {entityFields.map((field) => (
            <label
              key={field}
              className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                config.columns.includes(field)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="checkbox"
                checked={config.columns.includes(field)}
                onChange={() => toggleColumn(field)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700 capitalize">{field.replace(/_/g, ' ')}</span>
            </label>
          ))}
        </div>
      </div>

      {/* File Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">File Name (optional)</label>
        <input
          type="text"
          value={config.fileName || ''}
          onChange={(e) => onChange({ ...config, fileName: e.target.value })}
          placeholder={`export_${config.entityType}_${Date.now()}`}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>
    </div>
  );
};
