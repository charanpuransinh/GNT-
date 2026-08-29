/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║  M14 IMPORT/EXPORT — CONSTANTS & CONFIG                      ║
 * ║  Lock Artifact #15 — Module Configuration & Lock File        ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

export const M14_MODULE = {
  id: 'M14',
  name: 'Import/Export',
  version: '2.0.0',
  team: 'TEAM-C',
  session: 'Session-10',
  artifacts: 15,
  status: 'LOCKED',
  lockedAt: '2026-08-23T06:52:00+05:30',
  blueprint: 'GNT MASTER BLUEPRINT V2',
} as const;

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

export const SUPPORTED_FORMATS = {
  import: ['csv', 'excel', 'json', 'xml'] as const,
  export: ['csv', 'excel', 'json', 'pdf'] as const,
} as const;

export const SUPPORTED_ENTITIES = [
  'leads', 'contacts', 'products', 'orders', 'invoices', 'employees', 'customers', 'custom',
] as const;

export const ENTITY_FIELDS: Record<string, string[]> = {
  leads: ['id', 'name', 'email', 'phone', 'company', 'status', 'source', 'createdAt', 'updatedAt'],
  customers: ['id', 'name', 'email', 'phone', 'address', 'city', 'state', 'country', 'createdAt'],
  products: ['id', 'sku', 'name', 'description', 'price', 'quantity', 'category', 'status'],
  orders: ['id', 'customerId', 'amount', 'status', 'date', 'items', 'shippingAddress'],
  contacts: ['id', 'firstName', 'lastName', 'email', 'phone', 'address', 'company'],
  employees: ['id', 'name', 'email', 'department', 'designation', 'joinDate', 'status'],
  invoices: ['id', 'customerId', 'amount', 'dueDate', 'status', 'items'],
};

export const UPLOAD_CONFIG = {
  maxFileSize: 50 * 1024 * 1024,
  maxFiles: 1,
  allowedExtensions: ['.csv', '.xls', '.xlsx', '.json', '.xml'],
  chunkSize: 1024 * 1024, // 1MB chunks for large files
} as const;

export const PAGINATION = {
  defaultPage: 1,
  defaultLimit: 20,
  maxLimit: 100,
} as const;

export const PROGRESS_POLL_INTERVAL = 2000; // ms

export const LOCK_CHECKSUM = 'm14-import-export-frontend-v2-locked';
export const LOCK_ARTIFACTS = [
  'index.ts',
  'types/importExport.types.ts',
  'store/importExportStore.ts',
  'services/importExportApi.ts',
  'routes/ImportExportRoutes.tsx',
  'components/ImportExportLayout.tsx',
  'pages/ImportListPage.tsx',
  'pages/ImportWizardPage.tsx',
  'pages/ExportListPage.tsx',
  'pages/ExportWizardPage.tsx',
  'pages/TemplatesPage.tsx',
  'hooks/useImportExport.ts',
  'components/shared.tsx',
  'utils/helpers.ts',
  'constants/importExportConfig.ts',
] as const;

export const FEATURES = {
  csvImport: true,
  excelImport: true,
  jsonImport: true,
  xmlImport: false,
  csvExport: true,
  excelExport: true,
  jsonExport: true,
  pdfExport: false,
  autoMapping: true,
  dryRun: true,
  errorReports: true,
  importTemplates: true,
  exportTemplates: true,
  progressPolling: true,
  chunkedUpload: false,
} as const;
