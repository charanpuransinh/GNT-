// M14 Frontend — ImportProgress
// Lock: LOCK_05_COMPONENT
import React, { useEffect } from 'react';
import { useImportStore } from '../../stores/import.store';
import { StatusBadge } from '../Common/StatusBadge';
import { ProgressBar } from '../Common/ProgressBar';
import { ErrorAlert } from '../Common/ErrorAlert';

interface Props {
  jobId: string;
}

export const ImportProgress: React.FC<Props> = ({ jobId }) => {
  const { currentJob, fetchJob, pollJob, error, clearError } = useImportStore();

  useEffect(() => {
    fetchJob(jobId);
    const stop = pollJob(jobId, 3000);
    return () => stop();
  }, [jobId]);

  if (!currentJob) return <div className="text-gray-500">Loading job status...</div>;

  const { status, totalRows, processedRows, successRows, failedRows, errorLog, createdAt, completedAt } = currentJob;
  const isDone = status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED';

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <ErrorAlert message={error} onDismiss={clearError} />

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Import Job: {jobId.slice(0, 8)}...</h3>
        <StatusBadge status={status} />
      </div>

      <ProgressBar current={processedRows} total={totalRows} label="Progress" />

      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-green-50 rounded p-3">
          <div className="text-2xl font-bold text-green-700">{successRows}</div>
          <div className="text-xs text-green-600">Success</div>
        </div>
        <div className="bg-red-50 rounded p-3">
          <div className="text-2xl font-bold text-red-700">{failedRows}</div>
          <div className="text-xs text-red-600">Failed</div>
        </div>
        <div className="bg-gray-50 rounded p-3">
          <div className="text-2xl font-bold text-gray-700">{totalRows}</div>
          <div className="text-xs text-gray-600">Total</div>
        </div>
      </div>

      {errorLog && errorLog.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-red-700 mb-2">Errors ({errorLog.length})</h4>
          <div className="max-h-48 overflow-y-auto border rounded">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr><th className="px-2 py-1 text-left">Row</th><th className="px-2 py-1 text-left">Field</th><th className="px-2 py-1 text-left">Message</th></tr>
              </thead>
              <tbody>
                {errorLog.slice(0, 50).map((err, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-2 py-1">{err.row}</td>
                    <td className="px-2 py-1">{err.field || '-'}</td>
                    <td className="px-2 py-1 text-red-600">{err.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isDone && completedAt && (
        <div className="text-sm text-gray-500 text-right">
          Completed: {new Date(completedAt).toLocaleString()}
        </div>
      )}
    </div>
  );
};
