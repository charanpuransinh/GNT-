// M14 Import/Export — Core Types
// Lock: LOCK_02_TYPES

export type FileType = 'csv' | 'xlsx' | 'json';
export type ExportFormat = 'CSV' | 'XLSX' | 'JSON' | 'PDF';
export type EntityModule = 'M05' | 'M06' | 'M07' | 'M08' | 'M09' | 'M10' | 'M11' | 'M12' | 'M13';

export interface ImportRequest {
  fileBuffer: Buffer;
  fileType: FileType;
  module: string;
  entityType: string;
  templateId?: string;
  mappingOverride?: Record<string, string>;
  tenantId: string;
  userId: string;
  options?: {
    skipHeader?: boolean;
    batchSize?: number;
    dryRun?: boolean;
  };
}

export interface ExportRequest {
  module: string;
  entityType: string;
  format: 'csv' | 'xlsx' | 'json' | 'pdf';
  filters?: Record<string, any>;
  columns?: string[];
  sort?: { field: string; order: 'asc' | 'desc' }[];
  tenantId: string;
  userId: string;
  templateId?: string;
}

export interface ParseResult<T = Record<string, any>> {
  data: T[];
  errors: ParseError[];
  meta: { totalRows: number; validRows: number; headers: string[] };
}

export interface ParseError {
  row: number;
  field?: string;
  value?: any;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  data: any[];
}

export interface ValidationError {
  row: number;
  field: string;
  value: any;
  message: string;
  code: string;
}

export interface ValidationWarning {
  row: number;
  field: string;
  message: string;
}

export interface ImportProgress {
  jobId: string;
  status: string;
  totalRows: number;
  processedRows: number;
  successRows: number;
  failedRows: number;
  currentBatch: number;
  errorSnapshot?: any[];
}

export interface ExportProgress {
  jobId: string;
  status: string;
  totalRows: number;
  processedRows: number;
  fileUrl?: string;
}

export interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  transform?: 'uppercase' | 'lowercase' | 'trim' | 'date' | 'number' | 'boolean';
  required?: boolean;
  defaultValue?: any;
}

export interface StreamChunk<T = any> {
  chunk: T[];
  chunkIndex: number;
  isLast: boolean;
}
