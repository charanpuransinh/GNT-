import React from 'react';

interface PreviewGridProps {
  headers: string[];
  rows: any[];
  totalRows: number;
}

export const PreviewGrid: React.FC<PreviewGridProps> = ({ headers, rows, totalRows }) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Data Preview</h3>
          <p className="text-sm text-gray-500">Showing {rows.length} of {totalRows} rows</p>
        </div>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
          {totalRows} total rows
        </span>
      </div>
      <div className="overflow-x-auto max-h-96">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">#</th>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">{row._rowNumber}</td>
                {headers.map((header) => (
                  <td key={header} className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    {String(row[header] ?? '').substring(0, 50)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
