// M14 — Routes
// Lock: LOCK_11_ROUTES
import { Router } from 'express';
import multer from 'multer';
import { ImportController } from '../controllers/import.controller';
import { ExportController } from '../controllers/export.controller';
import { TemplateController } from '../controllers/template.controller';
import { JobController } from '../controllers/job.controller';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

const importCtrl = new ImportController();
const exportCtrl = new ExportController();
const templateCtrl = new TemplateController();
const jobCtrl = new JobController();

router.use(authMiddleware);
router.use(tenantMiddleware);

// Import Routes
router.post('/imports/upload', upload.single('file'), importCtrl.upload);
router.post('/imports/:jobId/validate', importCtrl.validate);
router.get('/imports/:jobId', importCtrl.getJob);
router.get('/imports', importCtrl.listJobs);
router.post('/imports/:jobId/cancel', importCtrl.cancel);
router.post('/imports/:jobId/retry', importCtrl.retry);

// Export Routes
router.post('/exports', exportCtrl.create);
router.get('/exports/:jobId', exportCtrl.getJob);
router.get('/exports', exportCtrl.listJobs);
router.post('/exports/:jobId/cancel', exportCtrl.cancel);
router.get('/exports/:jobId/download', exportCtrl.download);

// Template Routes
router.post('/templates', templateCtrl.create);
router.get('/templates', templateCtrl.list);
router.get('/templates/:id', templateCtrl.getById);
router.put('/templates/:id', templateCtrl.update);
router.delete('/templates/:id', templateCtrl.delete);

// Job Dashboard
router.get('/jobs/dashboard', jobCtrl.dashboard);
router.post('/jobs/cleanup', jobCtrl.cleanup);

export default router;
