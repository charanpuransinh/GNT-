import React, { useState } from 'react';
import { useSyncStore } from '../store/syncStore';
import { SyncAPI } from '../api/sync.api';
import { Database, Calendar, Package, Layers, FileArchive } from 'lucide-react';

export const BackupScheduler: React.FC = () => {
  const { backups, addBackup } = useSyncStore();
  const [form, setForm] = useState({
    name: '', description: '', scope: 'FULL' as 'FULL' | 'MODULE' | 'ENTITY',
    moduleCode: '', compressionType: 'GZIP'
  });
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!form.name) return;
    setCreating(true);
    try {
      const job = await SyncAPI.createBackup(form);
      addBackup(job);
      setForm({ name: '', description: '', scope: 'FULL', moduleCode: '', compressionType: 'GZIP' });
    } catch (err: any) { alert(err.message); }
    finally { setCreating(false); }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Database size={18} /> Create Backup
        </h3>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <input type="text" placeholder="Backup name" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          <input type="text" placeholder="Description (optional)" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          {(['FULL', 'MODULE', 'ENTITY'] as const).map((scope) => (
            <button key={scope} onClick={() => setForm({ ...form, scope })}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                form.scope === scope ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}>
              {scope === 'FULL' && <Layers size={14} />}
              {scope === 'MODULE' && <Package size={14} />}
              {scope === 'ENTITY' && <FileArchive size={14} />}
              {scope}
            </button>
          ))}
        </div>

        {form.scope === 'MODULE' && (
          <select value={form.moduleCode} onChange={(e) => setForm({ ...form, moduleCode: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4 focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">Select module...</option>
            <option value="M05">M05 &mdash; Inventory</option>
            <option value="M06">M06 &mdash; Customer</option>
            <option value="M07">M07 &mdash; Invoice</option>
            <option value="M08">M08 &mdash; Ledger</option>
            <option value="M11">M11 &mdash; Payment</option>
            <option value="M12">M12 &mdash; HR</option>
            <option value="M13">M13 &mdash; Automation</option>
            <option value="M14">M14 &mdash; Import/Export</option>
          </select>
        )}

        <button onClick={handleCreate} disabled={creating || !form.name}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed">
          <Calendar size={16} />
          {creating ? 'Creating...' : 'Create Backup'}
        </button>
      </div>

      <div className="space-y-2">
        {backups.map((backup) => (
          <div key={backup.id} className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">{backup.name}</div>
              <div className="text-xs text-gray-500">{backup.jobNumber} &bull; {backup.scope} &bull; {backup.status}</div>
            </div>
            <div className="flex items-center gap-3">
              {backup.fileUrl && (
                <a href={SyncAPI.downloadBackup(backup.id)} className="text-blue-600 text-xs font-medium hover:underline">Download</a>
              )}
              <button onClick={async () => { await SyncAPI.deleteBackup(backup.id); }}
                className="text-red-600 text-xs font-medium hover:underline">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
