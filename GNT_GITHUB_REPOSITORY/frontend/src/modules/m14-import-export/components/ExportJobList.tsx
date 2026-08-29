// M14 Frontend — ExportJobList
// Lock: LOCK_06_COMPONENT
import React, { useEffect, useState } from 'react';
import { useExportStore } from '../../stores/export.store';
import { StatusBadge } from '../Common/StatusBadge';
import { ErrorAlert } from '../Common/ErrorAlert';
import { ExportJob } from '../../types';

interface Props {
  onSelectJob?: (job: ExportJob) => void;
}

export const ExportJobList: React.FC<Props> = ({ onSelectJob }) => {
  const { jobs, fetchJobs, cancelJob, isLoading, error, clearError } = useExportStore();
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(() => fetchJobs(), 5000);
    return () => clearInterval(interval);
  }, []);

  const filtered = filter ? jobs.filter(j => j.status === filter) : jobs;

  return (
    <div className="space-y-4">
      <ErrorAlert message={error} onDismiss={clearError} />

      <div className="flex items-center gap-4">
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border rounded px-3 py-1 text-sm">
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="PROCESSING">Processing</option>
          <option value="COMPLETED">Completed</option>
          <option value="FAILED">Failed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <button onClick={() => fetchJobs()} className="text-sm text-blue-600 hover:underline">
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">ID</th>
              <th className="px-3 py-2 text-left">Module</th>
              <th className="px-3 py-2 text-left">Entity</th>
              <th className="px-3 py-2 text-left">Format</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Rows</th>
              <th className="px-3 py-2 text-left">Created</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((job) => (
              <tr key={job.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => onSelectJob?.(job)}>
                <td className="px-3 py-2 font-mono text-xs">{job.id.slice(0, 8)}...</td>
                <td className="px-3 py-2">{job.module}</td>
                <td className="px-3 py-2">{job.entityType}</td>
                <td className="px-3 py-2">{job.format}</td>
                <td className="px-3 py-2"><StatusBadge status={job.status} /></td>
                <td className="px-3 py-2">{job.totalRows}</td>
                <td className="px-3 py-2 text-gray-500">{new Date(job.createdAt).toLocaleDateString()}</td>
                <td className="px-3 py-2">
                  {job.status === 'PENDING' || job.status === 'PROCESSING' ? (
                    <button onClick={(e) => { e.stopPropagation(); cancelJob(job.id); }} className="text-red-600 hover:underline text-xs">Cancel</button>
                  ) : null}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-3 py-8 text-center text-gray-400">No export jobs found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
