import React, { useState } from 'react';
import { useSyncStore } from '../store/syncStore';
import { SyncConfigForm } from '../components/SyncConfigForm';
import { Plus, Settings, Trash2, Edit3 } from 'lucide-react';
import { SyncAPI } from '../api/sync.api';

export const SyncConfigPage: React.FC = () => {
  const { configs, removeConfig } = useSyncStore();
  const [showForm, setShowForm] = useState(false);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this sync config?')) return;
    await SyncAPI.deleteConfig(id);
    removeConfig(id);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings size={28} className="text-blue-600" />
            Sync Configurations
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage sync connections to external systems</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus size={16} /> New Config
        </button>
      </div>

      {showForm && (
        <div className="mb-6">
          <SyncConfigForm onClose={() => setShowForm(false)} />
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Code</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">System</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Direction</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Mode</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Last Sync</th>
              <th className="text-right py-3 px-4 font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {configs.map((config) => (
              <tr key={config.id} className="border-t hover:bg-gray-50">
                <td className="py-3 px-4 font-mono text-xs text-gray-600">{config.configCode}</td>
                <td className="py-3 px-4 font-medium text-gray-900">{config.name}</td>
                <td className="py-3 px-4 text-gray-600">{config.sourceSystem}</td>
                <td className="py-3 px-4 text-gray-600">{config.syncDirection}</td>
                <td className="py-3 px-4 text-gray-600">{config.syncMode}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    config.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                    config.status === 'PAUSED' ? 'bg-amber-100 text-amber-700' :
                    config.status === 'ERROR' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>{config.status}</span>
                </td>
                <td className="py-3 px-4 text-gray-500 text-xs">
                  {config.lastSyncAt ? new Date(config.lastSyncAt).toLocaleDateString() : 'Never'}
                </td>
                <td className="py-3 px-4 text-right">
                  <button className="text-gray-400 hover:text-blue-600 mr-2"><Edit3 size={16} /></button>
                  <button onClick={() => handleDelete(config.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
