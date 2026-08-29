export interface ExportColumn {
  field: string;
  header: string;
  width?: number;
  format?: string;
}

export interface ExportQuery {
  entityType: string;
  format: 'csv' | 'xlsx' | 'json' | 'pdf';
  columns: ExportColumn[];
  filters?: Record<string, any>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  pageSize?: number;
}

export interface ExportProgress {
  jobId: string;
  status: string;
  totalRows: number;
  processedRows: number;
  fileUrl?: string;
  expiresAt?: Date;
}
