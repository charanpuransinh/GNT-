import React from 'react';

interface ProgressTrackerProps {
  status: string;
  progress: number;
  totalRows: number;
  processedRows: number;
  successRows?: number;
  failedRows?: number;
  fileName?: string;
  fileUrl?: string;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-800',
  VALIDATING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  EXPIRED: 'bg-orange-100 text-orange-800'
};

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  status,
  progress,
  totalRows,
  processedRows,
  successRows,
  failedRows,
  fileName,
  fileUrl
}) => {
  const isComplete = ['COMPLETED', 'FAILED', 'CANCELLED', 'EXPIRED'].includes(status);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-lg font-semibold text-gray-800">{fileName || 'Processing...'}</h4>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${STATUS_COLORS[status] || 'bg-gray-100'}`}>
            {status}
          </span>
        </div>
        {fileUrl && (
          <a
            href={fileUrl}
            download
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            ⬇️ Download
          </a>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ${
            status === 'FAILED' ? 'bg-red-600' : status === 'COMPLETED' ? 'bg-green-600' : 'bg-blue-600'
          }`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-800">{totalRows}</div>
          <div className="text-xs text-gray-500">Total Rows</div>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{successRows ?? 0}</div>
          <div className="text-xs text-gray-500">Success</div>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{failedRows ?? 0}</div>
          <div className="text-xs text-gray-500">Failed</div>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-500 text-center">
        {processedRows} of {totalRows} rows processed ({Math.round(progress)}%)
      </div>
    </div>
  );
};
