export interface ImportRow {
  [key: string]: any;
  _rowNumber: number;
  _errors?: string[];
}

export interface FieldMapping {
  sourceColumn: string;
  targetField: string;
  transform?: string;
  required: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  data: any;
}

export interface ImportProgress {
  jobId: string;
  status: string;
  totalRows: number;
  processedRows: number;
  successRows: number;
  failedRows: number;
  currentBatch: number;
  totalBatches: number;
}

export interface ImportPreview {
  headers: string[];
  rows: any[];
  totalRows: number;
  detectedType: string;
  suggestedMapping: FieldMapping[];
}

export interface ExportConfig {
  entityType: string;
  format: 'csv' | 'xlsx' | 'json' | 'pdf';
  columns: string[];
  filters?: Record<string, any>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  fileName?: string;
}
