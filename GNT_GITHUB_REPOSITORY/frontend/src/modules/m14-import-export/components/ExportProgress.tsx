// M14 Frontend — ExportProgress
// Lock: LOCK_06_COMPONENT
import React, { useEffect } from 'react';
import { useExportStore } from '../../stores/export.store';
import { StatusBadge } from '../Common/StatusBadge';
import { ProgressBar } from '../Common/ProgressBar';
import { ErrorAlert } from '../Common/ErrorAlert';

interface Props {
  jobId: string;
}

export const ExportProgress: React.FC<Props> = ({ jobId }) => {
  const { currentJob, fetchJob, pollJob, downloadFile, error, clearError } = useExportStore();

  useEffect(() => {
    fetchJob(jobId);
    const stop = pollJob(jobId, 3000);
    return () => stop();
  }, [jobId]);

  if (!currentJob) return <div className="text-gray-500">Loading export status...</div>;

  const { status, totalRows, fileUrl, format, createdAt, completedAt } = currentJob;
  const isDone = status === 'COMPLETED';

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <ErrorAlert message={error} onDismiss={clearError} />

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Export Job: {jobId.slice(0, 8)}...</h3>
        <StatusBadge status={status} />
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
        <div>Format: <span className="font-medium">{format}</span></div>
        <div>Total Rows: <span className="font-medium">{totalRows}</span></div>
      </div>

      {status === 'PROCESSING' && <ProgressBar current={totalRows > 0 ? totalRows : 0} total={totalRows > 0 ? totalRows : 100} label="Processing" />}

      {isDone && fileUrl && (
        <div className="bg-green-50 border border-green-200 rounded p-4 text-center">
          <div className="text-green-700 font-medium mb-2">Export Ready!</div>
          <button
            onClick={() => downloadFile(jobId, `export_${currentJob.entityType}_${jobId}.${format.toLowerCase()}`)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
          >
            ⬇ Download File
          </button>
        </div>
      )}

      {completedAt && (
        <div className="text-sm text-gray-500 text-right">
          Completed: {new Date(completedAt).toLocaleString()}
        </div>
      )}
    </div>
  );
};
