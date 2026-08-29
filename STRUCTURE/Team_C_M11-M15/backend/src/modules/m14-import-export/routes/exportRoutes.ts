/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║  M14 IMPORT/EXPORT — EXPORT ROUTES                           ║
 * ║  Lock Artifact #5 — Express Router for Export Operations     ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

import { Router } from 'express';
import { ExportController } from '../controllers/exportController';
import { validateRequest } from '../middleware/validationMiddleware';
import { authMiddleware, tenantMiddleware } from '../middleware/authMiddleware';

const router = Router();
const controller = new ExportController();

router.use(authMiddleware);
router.use(tenantMiddleware);

// ── Export Job CRUD ──
router.get('/exports', controller.listExports);
router.get('/exports/:id', controller.getExport);
router.post('/exports', validateRequest, controller.createExport);
router.patch('/exports/:id', validateRequest, controller.updateExport);
router.delete('/exports/:id', controller.deleteExport);

// ── Execute Export ──
router.post('/exports/:id/execute', controller.executeExport);

// ── Progress & Download ──
router.get('/exports/:id/progress', controller.getProgress);
router.get('/exports/:id/download', controller.downloadExport);

// ── Cancel ──
router.post('/exports/:id/cancel', controller.cancelExport);

// ── Export Templates ──
router.get('/export-templates', controller.listTemplates);
router.get('/export-templates/:id', controller.getTemplate);
router.post('/export-templates', validateRequest, controller.createTemplate);
router.patch('/export-templates/:id', validateRequest, controller.updateTemplate);
router.delete('/export-templates/:id', controller.deleteTemplate);

export default router;
