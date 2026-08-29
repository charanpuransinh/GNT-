// M14 Frontend — useFileUpload Hook
// Lock: LOCK_10_HOOK
import { useState, useCallback } from 'react';

interface UseFileUploadOptions {
  maxSize?: number; // bytes
  accept?: string[];
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const { maxSize = 50 * 1024 * 1024, accept } = options;
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((selected: File | null) => {
    setError(null);
    if (!selected) { setFile(null); return; }
    if (maxSize && selected.size > maxSize) {
      setError(`File too large. Max ${(maxSize / 1024 / 1024).toFixed(0)}MB allowed.`);
      return;
    }
    if (accept && !accept.some(type => selected.type.includes(type) || selected.name.endsWith(type))) {
      setError(`Invalid file type. Allowed: ${accept.join(', ')}`);
      return;
    }
    setFile(selected);
  }, [maxSize, accept]);

  const clear = useCallback(() => { setFile(null); setError(null); }, []);

  return { file, error, handleFile, clear };
}
