// M14 Frontend — JobDashboard
// Lock: LOCK_08_COMPONENT
import React, { useEffect } from 'react';
import { useDashboardStore } from '../../stores/dashboard.store';
import { useImportStore } from '../../stores/import.store';
import { useExportStore } from '../../stores/export.store';
import { StatusBadge } from '../Common/StatusBadge';
import { ErrorAlert } from '../Common/ErrorAlert';

export const JobDashboard: React.FC = () => {
  const { stats, fetchStats, cleanup, isLoading, error, clearError } = useDashboardStore();
  const { jobs: importJobs } = useImportStore();
  const { jobs: exportJobs } = useExportStore();

  useEffect(() => {
    fetchStats();
    const interval = setInterval(() => fetchStats(), 10000);
    return () => clearInterval(interval);
  }, []);

  const statCard = (label: string, value: number, color: string) => (
    <div className={`${color} rounded-lg p-4 text-center`}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm opacity-80">{label}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <ErrorAlert message={error} onDismiss={clearError} />

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Import/Export Dashboard</h2>
        <div className="flex gap-2">
          <button onClick={() => fetchStats()} className="text-sm text-blue-600 hover:underline">
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button onClick={() => { if (confirm('Delete jobs older than 30 days?')) cleanup(30); }} className="text-sm text-red-600 hover:underline">
            Cleanup Old Jobs
          </button>
        </div>
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCard('Import Pending', stats.importStats.PENDING || 0, 'bg-yellow-100 text-yellow-800')}
            {statCard('Import Processing', stats.importStats.PROCESSING || 0, 'bg-indigo-100 text-indigo-800')}
            {statCard('Import Completed', stats.importStats.COMPLETED || 0, 'bg-green-100 text-green-800')}
            {statCard('Import Failed', stats.importStats.FAILED || 0, 'bg-red-100 text-red-800')}
            {statCard('Export Pending', stats.exportStats.PENDING || 0, 'bg-yellow-100 text-yellow-800')}
            {statCard('Export Processing', stats.exportStats.PROCESSING || 0, 'bg-indigo-100 text-indigo-800')}
            {statCard('Export Completed', stats.exportStats.COMPLETED || 0, 'bg-green-100 text-green-800')}
            {statCard('Export Failed', stats.exportStats.FAILED || 0, 'bg-red-100 text-red-800')}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-3">Recent Imports</h3>
              <div className="space-y-2">
                {stats.recentImports.map(job => (
                  <div key={job.id} className="flex items-center justify-between text-sm border-b pb-2">
                    <div>
                      <span className="font-mono text-xs">{job.id.slice(0, 8)}...</span>
                      <span className="mx-2 text-gray-400">|</span>
                      <span>{job.module} / {job.entityType}</span>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>
                ))}
                {stats.recentImports.length === 0 && <div className="text-gray-400 text-sm">No recent imports</div>}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-3">Recent Exports</h3>
              <div className="space-y-2">
                {stats.recentExports.map(job => (
                  <div key={job.id} className="flex items-center justify-between text-sm border-b pb-2">
                    <div>
                      <span className="font-mono text-xs">{job.id.slice(0, 8)}...</span>
                      <span className="mx-2 text-gray-400">|</span>
                      <span>{job.module} / {job.entityType}</span>
                      <span className="mx-2 text-gray-400">|</span>
                      <span className="text-gray-500">{job.format}</span>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>
                ))}
                {stats.recentExports.length === 0 && <div className="text-gray-400 text-sm">No recent exports</div>}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
