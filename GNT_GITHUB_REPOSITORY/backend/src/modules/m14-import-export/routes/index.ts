// M14 — Routes
// Lock: LOCK_11_ROUTES
import { Router } from 'express';
import multer from 'multer';
import { ImportController } from '../controllers/import.controller';
import { ExportController } from '../controllers/export.controller';
import { TemplateController } from '../controllers/template.controller';
import { JobController } from '../controllers/job.controller';
// मुख्य app की chain (auth + tenant, टास्क #009) हर /api/v1 रास्ते पर पहले ही चलती है —
// m14 के पुराने x-tenant-id वाले middleware यहाँ से हटा दिए (header पर भरोसा नहीं);
// controllers अब requireTenant/requireUser से पहचान लेते हैं।

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

const importCtrl = new ImportController();
const exportCtrl = new ExportController();
const templateCtrl = TemplateController; // static methods — class से ही बुलाते हैं
const jobCtrl = new JobController();

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
