/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║  M14 IMPORT/EXPORT MODULE — BACKEND ENTRY                    ║
 * ║  Lock Artifact #1 — Module Index                             ║
 * ╚═══════════════════════════════════════════════════════════════╝
 *
 * WIRING FIX (2026-08-28): this file previously exported from
 * './routes/importRoutes' + './services/importService' + './services/exportService'
 * (camelCase scaffold). That scaffold's routes file imports
 * '../middleware/authMiddleware' and '../middleware/validationMiddleware', which
 * do NOT exist anywhere in this module — those imports were dead on arrival, and
 * that file even says "TEMP MOCK or real" in its own comment.
 *
 * Meanwhile the actually complete, working router — `routes/index.ts`
 * (Lock: LOCK_11_ROUTES, uses the real `middleware/auth.ts` + `middleware/tenant.ts`
 * and the real `import.controller.ts` / `export.controller.ts` / `template.controller.ts`
 * / `job.controller.ts`) — was never exported or mounted anywhere. It was fully
 * orphaned despite being the correct implementation.
 *
 * This now points the module's PUBLIC entry at the real working set instead.
 * The old camelCase files (importRoutes.ts, exportRoutes.ts, importController.ts,
 * exportController.ts, importService.ts, exportService.ts, uploadMiddleware.ts) are
 * left in place but UNUSED — not deleted, since silent delete/rename isn't allowed.
 * Krisna: confirm these old camelCase files can be deleted, or if any of their logic
 * needs merging into the real controllers/services first.
 */

export { default as importExportRoutes } from './routes/index';
export * from './types/importExport.types';
export * from './services/import.service';
export * from './services/export.service';
export * from './services/template.service';
export * from './services/job.service';
export * from './utils/csvParser';
export * from './utils/excelHandler';
export * from './utils/fieldMapper';
