import React from 'react';
import { useSyncStore } from '../store/syncStore';
import { Clock, CheckCircle, XCircle, Loader } from 'lucide-react';

export const SyncJobTracker: React.FC = () => {
  const { currentJob, jobProgress } = useSyncStore();

  if (!currentJob) return null;

  const percent = jobProgress?.percentComplete || 0;
  const statusIcons: Record<string, React.ReactNode> = {
    QUEUED: <Clock size={18} className="text-gray-500" />,
    RUNNING: <Loader size={18} className="text-blue-500 animate-spin" />,
    COMPLETED: <CheckCircle size={18} className="text-emerald-500" />,
    FAILED: <XCircle size={18} className="text-red-500" />,
    CANCELLED: <XCircle size={18} className="text-gray-500" />
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {statusIcons[currentJob.status] || statusIcons.QUEUED}
          <div>
            <h3 className="font-semibold text-gray-900">{currentJob.jobNumber}</h3>
            <p className="text-sm text-gray-500">{currentJob.status}</p>
          </div>
        </div>
        <span className="text-2xl font-bold text-gray-900">{percent}%</span>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-3 mb-4 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            currentJob.status === 'FAILED' ? 'bg-red-500' :
            currentJob.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-blue-500'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {jobProgress && (
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <div className="font-bold text-emerald-600">{jobProgress.createdCount}</div>
            <div className="text-gray-500">Created</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <div className="font-bold text-blue-600">{jobProgress.updatedCount}</div>
            <div className="text-gray-500">Updated</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <div className="font-bold text-amber-600">{jobProgress.skippedCount}</div>
            <div className="text-gray-500">Skipped</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <div className="font-bold text-red-600">{jobProgress.errorCount + jobProgress.conflictCount}</div>
            <div className="text-gray-500">Issues</div>
          </div>
        </div>
      )}

      {jobProgress?.currentEntity && (
        <div className="mt-3 text-xs text-gray-500 flex items-center gap-2">
          <Loader size={12} className="animate-spin" />
          Processing: {jobProgress.currentEntity}
        </div>
      )}
    </div>
  );
};
