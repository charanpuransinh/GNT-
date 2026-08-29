// M14 Frontend — ImportUploader (Drag & Drop)
// Lock: LOCK_05_COMPONENT
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useImportStore } from '../../stores/import.store';
import { ErrorAlert } from '../Common/ErrorAlert';
import { UploadPayload } from '../../types';

interface Props {
  module: string;
  entityType: string;
  templateId?: string;
  onUploadComplete?: (jobId: string) => void;
}

export const ImportUploader: React.FC<Props> = ({ module, entityType, templateId, onUploadComplete }) => {
  const { uploadFile, isLoading, error, clearError, uploadProgress } = useImportStore();
  const [dryRun, setDryRun] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    const payload: UploadPayload = { file, module, entityType, templateId, dryRun };
    try {
      const jobId = await uploadFile(payload);
      onUploadComplete?.(jobId);
    } catch {
      // error handled in store
    }
  }, [module, entityType, templateId, dryRun, uploadFile, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/json': ['.json'],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
  });

  return (
    <div className="space-y-4">
      <ErrorAlert message={error} onDismiss={clearError} />

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} className="rounded" />
          Dry Run (validate only, don't import)
        </label>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
      >
        <input {...getInputProps()} />
        {isLoading ? (
          <div className="space-y-2">
            <div className="text-blue-600 font-medium">Uploading...</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        ) : (
          <>
            <div className="text-4xl mb-2">📁</div>
            <p className="text-gray-600">
              {isDragActive ? 'Drop the file here...' : 'Drag & drop a file here, or click to select'}
            </p>
            <p className="text-xs text-gray-400 mt-2">Supported: CSV, XLSX, JSON (max 50MB)</p>
          </>
        )}
      </div>
    </div>
  );
};
