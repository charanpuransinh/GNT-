/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║  M14 IMPORT/EXPORT — UTILITIES                               ║
 * ║  Lock Artifact #14 — Helper Functions                         ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

// ── Format File Size ──
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

// ── Format Date ──
export const formatDate = (date: string | null, opts?: Intl.DateTimeFormatOptions): string => {
  if (!date) return 'Never';
  return new Date(date).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', ...opts,
  });
};

// ── Format Number ──
export const formatNumber = (n: number): string => n.toLocaleString('en-IN');

// ── Slugify ──
export const slugify = (str: string): string =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// ── Generate ID ──
export const generateId = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ── Deep Clone ──
export const deepClone = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj));

// ── Sleep ──
export const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

// ── Download Blob ──
export const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

// ── Parse CSV (Simple) ──
export const parseCSVLine = (line: string, delimiter = ','): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') { inQuotes = !inQuotes; }
    else if (char === delimiter && !inQuotes) { result.push(current.trim()); current = ''; }
    else { current += char; }
  }
  result.push(current.trim());
  return result;
};
