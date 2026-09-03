// ============================================================================
// M14 IMPORT/EXPORT — ImportExportPage (लाना-लेजाना डैशबोर्ड, ROUGH)
// upload → jobs → templates; export की प्रविष्टि ExportService से
// ============================================================================

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/core/api-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface Job {
  id: string;
  file_name?: string;
  fileName?: string;
  status?: string;
  created_at?: string;
}

export const ImportExportPage: React.FC = () => {
  const [imports, setImports] = useState<Job[]>([]);
  const [exports_, setExports] = useState<Job[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get<{ success: boolean; data: Job[] }>('/imports/imports').then((r) => setImports(r.data.data ?? [])).catch(() => undefined);
    apiClient.get<{ success: boolean; data: Job[] }>('/imports/exports').then((r) => setExports(r.data.data ?? [])).catch(() => undefined);
  }, []);

  const upload = async () => {
    if (!file) return setError('फाइल चुनें');
    setUploading(true);
    setError('');
    setMessage('');
    try {
      const form = new FormData();
      form.append('file', file);
      await apiClient.post('/imports/imports/upload', form);
      setMessage('फाइल चढ़ गई ✅');
      setFile(null);
      apiClient.get<{ success: boolean; data: Job[] }>('/imports/imports').then((r) => setImports(r.data.data ?? [])).catch(() => undefined);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'गलती');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">लाना-लेजाना (Import/Export)</h1>
      <Card className="space-y-3 max-w-xl">
        <input
          type="file"
          className="block w-full text-sm text-slate-600"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] ?? null)}
        />
        <Button variant="primary" loading={uploading} onClick={() => void upload()}>फाइल चढ़ाएँ</Button>
      </Card>
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <h2 className="font-semibold">आयात (imports)</h2>
      <div className="space-y-2">
        {imports.map((j) => (
          <Card key={j.id} className="flex items-center justify-between">
            <p className="font-medium">{j.file_name ?? j.fileName ?? j.id}</p>
            <Badge variant="info">{j.status ?? '—'}</Badge>
          </Card>
        ))}
      </div>
      <h2 className="font-semibold">निर्यात (exports)</h2>
      <div className="space-y-2">
        {exports_.map((j) => (
          <Card key={j.id} className="flex items-center justify-between">
            <p className="font-medium">{j.file_name ?? j.fileName ?? j.id}</p>
            <Badge variant="info">{j.status ?? '—'}</Badge>
          </Card>
        ))}
      </div>
    </div>
  );
};
