import React, { useEffect, useState } from 'react';
import { useSync } from '../hooks/useSync';
import { useSyncJobs } from '../hooks/useSyncJobs';
import { useSyncStore } from '../store/syncStore';
import { SyncStatusCard } from '../components/SyncStatusCard';
import { SyncJobTracker } from '../components/SyncJobTracker';
import { Activity, RefreshCw } from 'lucide-react';

export const SyncMonitorPage: React.FC = () => {
  const { configs, jobs, currentJob } = useSyncStore();
  const { fetchConfigs, fetchJobs, triggerSync } = useSync();
  const { startPolling } = useSyncJobs();
  const [triggeringId, setTriggeringId] = useState<string | null>(null);

  useEffect(() => {
    fetchConfigs();
    fetchJobs({ limit: '10' });
  }, []);

  const handleTrigger = async (configId: string) => {
    setTriggeringId(configId);
    try {
      const job = await triggerSync(configId);
      startPolling(job.id);
    } finally {
      setTriggeringId(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity size={28} className="text-blue-600" />
            Sync Monitor
          </h1>
          <p className="text-sm text-gray-500 mt-1">Monitor and trigger synchronization jobs across external systems</p>
        </div>
        <button onClick={() => { fetchConfigs(); fetchJobs({ limit: '10' }); }}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {currentJob && <SyncJobTracker />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {configs.map((config) => (
          <SyncStatusCard key={config.id} config={config} onTrigger={handleTrigger} />
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Recent Jobs</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="text-left py-2 px-3">Job #</th>
                <th className="text-left py-2 px-3">Config</th>
                <th className="text-left py-2 px-3">Status</th>
                <th className="text-left py-2 px-3">Entities</th>
                <th className="text-left py-2 px-3">Created</th>
                <th className="text-left py-2 px-3">Updated</th>
                <th className="text-left py-2 px-3">Conflicts</th>
                <th className="text-left py-2 px-3">Duration</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-3 font-mono text-xs">{job.jobNumber}</td>
                  <td className="py-2 px-3">{job.syncConfig?.name || '&#8212;'}</td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      job.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                      job.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                      job.status === 'RUNNING' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>{job.status}</span>
                  </td>
                  <td className="py-2 px-3">{job.processedEntities}/{job.totalEntities}</td>
                  <td className="py-2 px-3 text-emerald-600">{job.createdCount}</td>
                  <td className="py-2 px-3 text-blue-600">{job.updatedCount}</td>
                  <td className="py-2 px-3 text-amber-600">{job.conflictCount}</td>
                  <td className="py-2 px-3 text-gray-500">{job.durationMs ? `${(job.durationMs / 1000).toFixed(1)}s` : '&#8212;'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
