/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║  M14 IMPORT/EXPORT — TYPES & INTERFACES                      ║
 * ║  Lock Artifact #2 — Domain Types                             ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

export type ImportStatus = 'pending' | 'validating' | 'processing' | 'completed' | 'failed' | 'partial';
export type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type FileFormat = 'csv' | 'excel' | 'json' | 'xml' | 'pdf';
export type EntityType = 'leads' | 'contacts' | 'products' | 'orders' | 'invoices' | 'employees' | 'customers' | 'custom';
export type MappingStrategy = 'auto' | 'manual' | 'template';

export interface ImportJob {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  entityType: EntityType;
  fileFormat: FileFormat;
  fileName: string;
  fileSize: number;
  fileUrl: string;
  status: ImportStatus;
  mapping: FieldMapping[];
  mappingStrategy: MappingStrategy;
  validationRules: ValidationRule[];
  totalRows: number;
  processedRows: number;
  successRows: number;
  failedRows: number;
  skippedRows: number;
  errors: ImportError[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  dryRun: boolean;
}

export interface ExportJob {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  entityType: EntityType;
  fileFormat: FileFormat;
  status: ExportStatus;
  filters: Record<string, any>;
  selectedFields: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  totalRows: number;
  fileUrl: string | null;
  fileSize: number | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  expiresAt: Date | null;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transform?: string; // e.g., "uppercase", "date:YYYY-MM-DD", "lookup:users.id"
  required: boolean;
  defaultValue?: string;
}

export interface ValidationRule {
  field: string;
  rule: 'required' | 'email' | 'unique' | 'regex' | 'range' | 'enum' | 'length' | 'custom';
  config: Record<string, any>;
  errorMessage: string;
}

export interface ImportError {
  rowNumber: number;
  field: string;
  value: any;
  error: string;
  severity: 'error' | 'warning';
}

export interface ImportTemplate {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  entityType: EntityType;
  fileFormat: FileFormat;
  mapping: FieldMapping[];
  validationRules: ValidationRule[];
  sampleFileUrl: string | null;
  isDefault: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExportTemplate {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  entityType: EntityType;
  fileFormat: FileFormat;
  selectedFields: string[];
  filters: Record<string, any>;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  isDefault: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ImportPreview {
  headers: string[];
  sampleRows: Record<string, any>[];
  detectedFormat: FileFormat;
  detectedDelimiter: string;
  totalRows: number;
  suggestedMapping: FieldMapping[];
}

export interface ImportProgress {
  jobId: string;
  status: ImportStatus;
  totalRows: number;
  processedRows: number;
  successRows: number;
  failedRows: number;
  currentBatch: number;
  totalBatches: number;
  percentage: number;
  etaSeconds: number | null;
}

export interface ExportProgress {
  jobId: string;
  status: ExportStatus;
  totalRows: number;
  processedRows: number;
  percentage: number;
}

export interface BulkOperationResult {
  jobId: string;
  status: ImportStatus | ExportStatus;
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  errors: ImportError[];
  fileUrl?: string;
}
