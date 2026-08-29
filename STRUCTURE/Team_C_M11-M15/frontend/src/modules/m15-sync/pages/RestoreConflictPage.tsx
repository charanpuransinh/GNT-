import React, { useEffect } from 'react';
import { useSyncStore } from '../store/syncStore';
import { SyncAPI } from '../api/sync.api';
import { ConflictResolver } from '../components/ConflictResolver';
import { GitCompare, Zap } from 'lucide-react';

export const RestoreConflictPage: React.FC = () => {
  const { setConflicts, setConflictStats } = useSyncStore();

  useEffect(() => {
    loadConflicts();
  }, []);

  const loadConflicts = async () => {
    try {
      const [conflictData, stats] = await Promise.all([
        SyncAPI.getConflicts({ status: 'PENDING' }),
        SyncAPI.getConflictStats()
      ]);
      setConflicts(conflictData);
      setConflictStats(stats);
    } catch (err: any) { console.error(err); }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <GitCompare size={28} className="text-amber-600" />
            Conflict Resolution
          </h1>
          <p className="text-sm text-gray-500 mt-1">Review and resolve data conflicts from sync operations</p>
        </div>
        <button onClick={loadConflicts}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
          <Zap size={16} /> Refresh
        </button>
      </div>

      <ConflictResolver />
    </div>
  );
};
