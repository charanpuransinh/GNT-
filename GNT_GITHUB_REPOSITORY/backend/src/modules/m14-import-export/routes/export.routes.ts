import { Router } from 'express';
import { ExportController } from '../controllers/export.controller';

const router = Router();

router.post('/create', ExportController.createExport);
router.get('/status/:jobId', ExportController.getStatus);
router.get('/jobs', ExportController.listJobs);
router.get('/download/:jobId', ExportController.downloadFile);

export default router;
