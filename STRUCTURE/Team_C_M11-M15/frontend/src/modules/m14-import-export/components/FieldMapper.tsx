import React from 'react';
import { FieldMapping } from '../types/importExport.types';

interface FieldMapperProps {
  headers: string[];
  mapping: FieldMapping[];
  onMappingChange: (mapping: FieldMapping[]) => void;
  targetFields: string[];
}

export const FieldMapper: React.FC<FieldMapperProps> = ({
  headers,
  mapping,
  onMappingChange,
  targetFields
}) => {
  const handleFieldChange = (index: number, targetField: string) => {
    const newMapping = [...mapping];
    newMapping[index] = { ...newMapping[index], targetField };
    onMappingChange(newMapping);
  };

  const handleRequiredChange = (index: number, required: boolean) => {
    const newMapping = [...mapping];
    newMapping[index] = { ...newMapping[index], required };
    onMappingChange(newMapping);
  };

  const handleTransformChange = (index: number, transform: string) => {
    const newMapping = [...mapping];
    newMapping[index] = { ...newMapping[index], transform: transform || undefined };
    onMappingChange(newMapping);
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Field Mapping</h3>
        <p className="text-sm text-gray-500">Map your file columns to system fields</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source Column</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target Field</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transform</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Required</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {mapping.map((map, index) => (
              <tr key={map.sourceColumn} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {map.sourceColumn}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={map.targetField}
                    onChange={(e) => handleFieldChange(index, e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">-- Select Field --</option>
                    {targetFields.map((field) => (
                      <option key={field} value={field}>{field}</option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={map.transform || ''}
                    onChange={(e) => handleTransformChange(index, e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">None</option>
                    <option value="uppercase">Uppercase</option>
                    <option value="lowercase">Lowercase</option>
                    <option value="trim">Trim</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                    <option value="date">Date</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={map.required}
                    onChange={(e) => handleRequiredChange(index, e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
