// M14 Frontend — Core Types
// Lock: LOCK_01_TYPES

export type FileType = 'csv' | 'xlsx' | 'json';
export type ExportFormat = 'CSV' | 'XLSX' | 'JSON' | 'PDF';

export type ImportStatus = 'PENDING' | 'VALIDATING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type ExportStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface ImportJob {
  id: string;
  tenantId: string;
  module: string;
  entityType: string;
  fileUrl: string;
  fileType: FileType;
  status: ImportStatus;
  mappingConfig: Record<string, string> | null;
  totalRows: number;
  processedRows: number;
  successRows: number;
  failedRows: number;
  errorLog: ImportError[] | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface ExportJob {
  id: string;
  tenantId: string;
  module: string;
  entityType: string;
  format: ExportFormat;
  filters: Record<string, any> | null;
  sortConfig: { field: string; order: 'asc' | 'desc' }[] | null;
  columnConfig: string[] | null;
  fileUrl: string | null;
  status: ExportStatus;
  totalRows: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface ImportError {
  row: number;
  field?: string;
  value?: any;
  message: string;
  code: string;
}

export interface ImportTemplate {
  id: string;
  tenantId: string;
  name: string;
  module: string;
  entityType: string;
  fileType: FileType;
  columnMapping: ColumnMapping[];
  sampleFileUrl: string | null;
  isDefault: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExportTemplate {
  id: string;
  tenantId: string;
  name: string;
  module: string;
  entityType: string;
  format: ExportFormat;
  columnConfig: string[];
  filterConfig: Record<string, any> | null;
  sortConfig: { field: string; order: 'asc' | 'desc' }[] | null;
  isDefault: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  transform?: 'uppercase' | 'lowercase' | 'trim' | 'date' | 'number' | 'boolean';
  required?: boolean;
  defaultValue?: any;
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

export interface DashboardStats {
  importStats: Record<ImportStatus, number>;
  exportStats: Record<ExportStatus, number>;
  recentImports: ImportJob[];
  recentExports: ExportJob[];
}

export interface UploadPayload {
  file: File;
  module: string;
  entityType: string;
  templateId?: string;
  mappingOverride?: Record<string, string>;
  dryRun?: boolean;
}

export interface ExportPayload {
  module: string;
  entityType: string;
  format: ExportFormat;
  filters?: Record<string, any>;
  columns?: string[];
  sort?: { field: string; order: 'asc' | 'desc' }[];
  templateId?: string;
}
