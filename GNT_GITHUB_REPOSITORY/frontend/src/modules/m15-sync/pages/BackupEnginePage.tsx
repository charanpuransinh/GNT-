import React, { useEffect } from 'react';
import { useSyncStore } from '../store/syncStore';
import { SyncAPI } from '../api/sync.api';
import { BackupScheduler } from '../components/BackupScheduler';
import { Database } from 'lucide-react';

export const BackupEnginePage: React.FC = () => {
  const { setBackups } = useSyncStore();

  useEffect(() => {
    SyncAPI.getBackups().then(setBackups).catch(console.error);
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Database size={28} className="text-emerald-600" />
          Backup Engine
        </h1>
        <p className="text-sm text-gray-500 mt-1">Create and manage system backups</p>
      </div>

      <BackupScheduler />
    </div>
  );
};
