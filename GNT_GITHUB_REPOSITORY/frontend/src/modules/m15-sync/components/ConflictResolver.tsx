import React, { useState } from 'react';
import { useSyncStore } from '../store/syncStore';
import { SyncAPI } from '../api/sync.api';
import { GitCompare, ArrowLeft, ArrowRight, Merge } from 'lucide-react';

export const ConflictResolver: React.FC = () => {
  const { conflicts, conflictStats, setConflicts, resolveConflict } = useSyncStore();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [resolving, setResolving] = useState(false);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const handleResolve = async (conflictId: string, resolution: string) => {
    setResolving(true);
    try {
      await SyncAPI.resolveConflict(conflictId, resolution, 'user-current');
      resolveConflict(conflictId, resolution);
    } catch (err: any) { alert(err.message); }
    finally { setResolving(false); }
  };

  const handleBulkResolve = async (resolution: string) => {
    if (selectedIds.size === 0) return;
    setResolving(true);
    try {
      await SyncAPI.bulkResolve(Array.from(selectedIds), resolution, 'user-current');
      const updated = await SyncAPI.getConflicts({ status: 'PENDING' });
      setConflicts(updated);
      setSelectedIds(new Set());
    } catch (err: any) { alert(err.message); }
    finally { setResolving(false); }
  };

  if (conflicts.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="mx-auto mb-3 text-emerald-500">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h3 className="font-semibold text-gray-900">No Pending Conflicts</h3>
        <p className="text-sm text-gray-500 mt-1">All sync conflicts have been resolved.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {conflictStats && (
        <div className="flex items-center gap-4 text-sm bg-gray-50 rounded-lg px-4 py-3">
          <span className="font-medium">Total: {conflictStats.total}</span>
          <span className="text-amber-600 font-medium">Pending: {conflictStats.pending}</span>
          <span className="text-emerald-600 font-medium">Resolved: {conflictStats.resolved}</span>
          {selectedIds.size > 0 && (
            <div className="ml-auto flex gap-2">
              <button onClick={() => handleBulkResolve('INTERNAL_WINS')} className="px-3 py-1 bg-blue-600 text-white rounded text-xs">Use Internal</button>
              <button onClick={() => handleBulkResolve('EXTERNAL_WINS')} className="px-3 py-1 bg-gray-600 text-white rounded text-xs">Use External</button>
            </div>
          )}
        </div>
      )}

      {conflicts.filter(c => c.status === 'PENDING').map((conflict) => (
        <div key={conflict.id} className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <input
              type="checkbox"
              checked={selectedIds.has(conflict.id)}
              onChange={() => toggleSelect(conflict.id)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <GitCompare size={18} className="text-amber-500" />
            <span className="font-semibold text-gray-900">{conflict.entityType}</span>
            <span className="text-xs text-gray-500 ml-auto">{new Date(conflict.createdAt).toLocaleString()}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-xs text-blue-600 font-medium mb-1 flex items-center gap-1">
                <ArrowLeft size={12} /> Internal
              </div>
              <pre className="text-xs text-gray-700 overflow-auto max-h-32">
                {JSON.stringify(conflict.internalValue, null, 2)}
              </pre>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="text-xs text-purple-600 font-medium mb-1 flex items-center gap-1">
                <ArrowRight size={12} /> External
              </div>
              <pre className="text-xs text-gray-700 overflow-auto max-h-32">
                {JSON.stringify(conflict.externalValue, null, 2)}
              </pre>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => handleResolve(conflict.id, 'INTERNAL_WINS')} disabled={resolving}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50">
              <ArrowLeft size={12} /> Use Internal
            </button>
            <button onClick={() => handleResolve(conflict.id, 'EXTERNAL_WINS')} disabled={resolving}
              className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 disabled:opacity-50">
              <ArrowRight size={12} /> Use External
            </button>
            <button onClick={() => handleResolve(conflict.id, 'MERGED')} disabled={resolving}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 disabled:opacity-50">
              <Merge size={12} /> Merge
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
