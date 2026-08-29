import React from 'react';
import { RefreshCw, AlertTriangle, Activity } from 'lucide-react';
import { SyncConfig } from '../types/sync.types';

interface Props {
  config: SyncConfig;
  onTrigger: (id: string) => void;
}

export const SyncStatusCard: React.FC<Props> = ({ config, onTrigger }) => {
  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    PAUSED: 'bg-amber-100 text-amber-800 border-amber-200',
    ERROR: 'bg-red-100 text-red-800 border-red-200',
    DISABLED: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{config.name}</h3>
          <p className="text-sm text-gray-500">{config.configCode} &bull; {config.sourceSystem}</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[config.status] || statusColors.DISABLED}`}>
          {config.status}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
        <div className="bg-gray-50 rounded-lg p-2 text-center">
          <div className="text-gray-500 text-xs">Direction</div>
          <div className="font-medium text-gray-800">{config.syncDirection}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2 text-center">
          <div className="text-gray-500 text-xs">Mode</div>
          <div className="font-medium text-gray-800">{config.syncMode}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2 text-center">
          <div className="text-gray-500 text-xs">Entities</div>
          <div className="font-medium text-gray-800">{config.entityConfigs?.length || 0}</div>
        </div>
      </div>

      {config.lastSyncAt && (
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
          <Activity size={14} />
          Last sync: {new Date(config.lastSyncAt).toLocaleString()}
          {config.lastSyncStatus && (
            <span className={`ml-1 ${config.lastSyncStatus === 'SUCCESS' ? 'text-emerald-600' : 'text-amber-600'}`}>
              ({config.lastSyncStatus})
            </span>
          )}
        </div>
      )}

      {config.consecutiveErrors > 0 && (
        <div className="flex items-center gap-2 text-xs text-red-600 mb-3 bg-red-50 rounded-lg px-3 py-2">
          <AlertTriangle size={14} />
          {config.consecutiveErrors} consecutive errors (threshold: {config.errorThreshold})
        </div>
      )}

      <button
        onClick={() => onTrigger(config.id)}
        disabled={config.status !== 'ACTIVE'}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        <RefreshCw size={16} />
        Trigger Sync
      </button>
    </div>
  );
};
