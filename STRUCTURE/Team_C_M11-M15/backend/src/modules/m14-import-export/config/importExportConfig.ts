/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║  M14 IMPORT/EXPORT — CONSTANTS & CONFIG                      ║
 * ║  Lock Artifact #15 — Module Configuration & Lock File        ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

// ── Module Metadata ──
export const M14_MODULE = {
  id: 'M14',
  name: 'Import/Export',
  version: '2.0.0',
  team: 'TEAM-C',
  session: 'Session-9',
  artifacts: 15,
  status: 'LOCKED',
  lockedAt: '2026-08-23T06:05:00+05:30',
  blueprint: 'GNT MASTER BLUEPRINT V2',
} as const;

// ── API Endpoints ──
export const API_ENDPOINTS = {
  imports: '/imports',
  exports: '/exports',
  importTemplates: '/import-templates',
  exportTemplates: '/export-templates',
  upload: '/imports/upload',
  preview: '/imports/:id/preview',
  validate: '/imports/:id/validate',
  executeImport: '/imports/:id/execute',
  executeDryRun: '/imports/:id/execute-dry',
  executeExport: '/exports/:id/execute',
  progress: '/:type/:id/progress',
  download: '/exports/:id/download',
  errorReport: '/imports/:id/download-errors',
} as const;

// ── Supported File Formats ──
export const SUPPORTED_FORMATS = {
  import: ['csv', 'excel', 'json', 'xml'] as const,
  export: ['csv', 'excel', 'json', 'pdf'] as const,
} as const;

// ── Supported Entities ──
export const SUPPORTED_ENTITIES = [
  'leads',
  'contacts',
  'products',
  'orders',
  'invoices',
  'employees',
  'customers',
  'custom',
] as const;

// ── Entity Field Definitions ──
export const ENTITY_FIELDS: Record<string, { name: string; type: string; required: boolean }[]> = {
  leads: [
    { name: 'name', type: 'string', required: true },
    { name: 'email', type: 'email', required: true },
    { name: 'phone', type: 'string', required: false },
    { name: 'company', type: 'string', required: false },
    { name: 'status', type: 'enum', required: false },
    { name: 'source', type: 'string', required: false },
  ],
  customers: [
    { name: 'name', type: 'string', required: true },
    { name: 'email', type: 'email', required: true },
    { name: 'phone', type: 'string', required: false },
    { name: 'address', type: 'string', required: false },
    { name: 'city', type: 'string', required: false },
  ],
  products: [
    { name: 'sku', type: 'string', required: true },
    { name: 'name', type: 'string', required: true },
    { name: 'price', type: 'number', required: true },
    { name: 'quantity', type: 'number', required: false },
    { name: 'category', type: 'string', required: false },
  ],
};

// ── Default Validation Rules ──
export const DEFAULT_VALIDATION_RULES: Record<string, any[]> = {
  leads: [
    { field: 'name', rule: 'required', config: {}, errorMessage: 'Name is required' },
    { field: 'email', rule: 'email', config: {}, errorMessage: 'Invalid email format' },
  ],
  customers: [
    { field: 'name', rule: 'required', config: {}, errorMessage: 'Name is required' },
    { field: 'email', rule: 'email', config: {}, errorMessage: 'Invalid email format' },
  ],
  products: [
    { field: 'sku', rule: 'required', config: {}, errorMessage: 'SKU is required' },
    { field: 'name', rule: 'required', config: {}, errorMessage: 'Product name is required' },
    { field: 'price', rule: 'range', config: { min: 0 }, errorMessage: 'Price must be >= 0' },
  ],
};

// ── Upload Config ──
export const UPLOAD_CONFIG = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  maxFiles: 1,
  allowedExtensions: ['.csv', '.xls', '.xlsx', '.json', '.xml'],
  allowedMimetypes: [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/json',
    'application/xml',
    'text/xml',
  ],
  uploadDir: 'uploads',
  cleanupIntervalHours: 24,
} as const;

// ── Queue Config ──
export const QUEUE_CONFIG = {
  importQueue: 'm14:import:queue',
  exportQueue: 'm14:export:queue',
  deadLetterQueue: 'm14:dead:letter',
  maxAttempts: 3,
  retryDelayMs: 5000,
  batchSize: 100,
  workerPollInterval: 5,
} as const;

// ── Export Config ──
export const EXPORT_CONFIG = {
  maxRows: 100000,
  defaultExpiryDays: 7,
  streamThreshold: 10000, // Use streaming for >10k rows
} as const;

// ── Pagination Defaults ──
export const PAGINATION = {
  defaultPage: 1,
  defaultLimit: 20,
  maxLimit: 100,
} as const;

// ── Lock Verification ──
export const LOCK_CHECKSUM = 'm14-import-export-backend-v2-locked';
export const LOCK_ARTIFACTS = [
  'index.ts',
  'types/importExport.types.ts',
  'prisma/schema.prisma',
  'routes/importRoutes.ts',
  'routes/exportRoutes.ts',
  'controllers/importController.ts',
  'controllers/exportController.ts',
  'services/importService.ts',
  'services/exportService.ts',
  'services/queueService.ts',
  'middleware/uploadMiddleware.ts',
  'utils/csvParser.ts',
  'utils/excelHandler.ts',
  'utils/fieldMapper.ts',
  'constants/importExportConfig.ts',
] as const;

// ── Feature Flags ──
export const FEATURES = {
  csvImport: true,
  excelImport: true,
  jsonImport: true,
  xmlImport: false, // Coming in V2.1
  csvExport: true,
  excelExport: true,
  jsonExport: true,
  pdfExport: false, // Coming in V2.1
  scheduledImports: false, // Coming in V2.1
  scheduledExports: false, // Coming in V2.1
  autoMapping: true,
  dryRun: true,
  errorReports: true,
  importTemplates: true,
  exportTemplates: true,
} as const;
