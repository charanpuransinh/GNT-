import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface DragDropUploaderProps {
  onFileSelect: (file: File) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
}

export const DragDropUploader: React.FC<DragDropUploaderProps> = ({
  onFileSelect,
  accept = {
    'text/csv': ['.csv'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'application/json': ['.json']
  },
  maxSize = 50 * 1024 * 1024
}) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false)
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
        isDragActive
          ? 'border-blue-500 bg-blue-50'
          : isDragReject
          ? 'border-red-500 bg-red-50'
          : 'border-gray-300 hover:border-gray-400'
      }`}
    >
      <input {...getInputProps()} />
      <div className="text-4xl mb-4">📁</div>
      <p className="text-lg font-medium text-gray-700">
        {isDragActive ? 'Drop the file here...' : 'Drag & drop a file here, or click to select'}
      </p>
      <p className="text-sm text-gray-500 mt-2">
        Supports CSV, Excel (.xlsx), and JSON files up to 50MB
      </p>
      {isDragReject && (
        <p className="text-sm text-red-500 mt-2">File type not supported or file too large</p>
      )}
    </div>
  );
};
