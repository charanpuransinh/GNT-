/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║  M14 IMPORT/EXPORT — IMPORT ROUTES                           ║
 * ║  Lock Artifact #4 — Express Router for Import Operations     ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

import { Router } from 'express';
import { ImportController } from '../controllers/importController';
import { uploadMiddleware } from '../middleware/uploadMiddleware';
import { validateRequest } from '../middleware/validationMiddleware'; // TEMP MOCK or real
import { authMiddleware, tenantMiddleware } from '../middleware/authMiddleware'; // TEMP MOCK

const router = Router();
const controller = new ImportController();

// ── All routes require auth + tenant ──
router.use(authMiddleware);
router.use(tenantMiddleware);

// ── Import Job CRUD ──
router.get('/imports', controller.listImports);
router.get('/imports/:id', controller.getImport);
router.post('/imports', validateRequest, controller.createImport);
router.patch('/imports/:id', validateRequest, controller.updateImport);
router.delete('/imports/:id', controller.deleteImport);

// ── File Upload & Preview ──
router.post('/imports/upload', uploadMiddleware.single('file'), controller.uploadFile);
router.post('/imports/:id/preview', controller.previewImport);
router.post('/imports/:id/validate', controller.validateImport);

// ── Execute Import ──
router.post('/imports/:id/execute', controller.executeImport);
router.post('/imports/:id/execute-dry', controller.executeDryRun);

// ── Progress & Status ──
router.get('/imports/:id/progress', controller.getProgress);
router.get('/imports/:id/errors', controller.getErrors);
router.get('/imports/:id/download-errors', controller.downloadErrorReport);

// ── Cancel / Retry ──
router.post('/imports/:id/cancel', controller.cancelImport);
router.post('/imports/:id/retry', controller.retryImport);

// ── Import Templates ──
router.get('/import-templates', controller.listTemplates);
router.get('/import-templates/:id', controller.getTemplate);
router.post('/import-templates', validateRequest, controller.createTemplate);
router.patch('/import-templates/:id', validateRequest, controller.updateTemplate);
router.delete('/import-templates/:id', controller.deleteTemplate);

export default router;
