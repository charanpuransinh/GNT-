import { Router } from 'express';
import { ImportController } from '../controllers/import.controller';
import { uploadSingle } from '../middleware/upload.middleware';

const router = Router();

router.post('/upload', uploadSingle, ImportController.uploadFile);
router.get('/preview/:jobId', ImportController.previewFile);
router.post('/process/:jobId', ImportController.processImport);
router.get('/status/:jobId', ImportController.getStatus);
router.get('/jobs', ImportController.listJobs);
router.post('/cancel/:jobId', ImportController.cancelJob);

export default router;
