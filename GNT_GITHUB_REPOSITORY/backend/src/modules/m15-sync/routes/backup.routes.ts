import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/tenant.middleware';

import { BackupController } from '../controllers/backup.controller';

const router = Router();

router.post('/', (req: AuthenticatedRequest, res: Response) => BackupController.createBackup(req, res));
router.get('/', (req: AuthenticatedRequest, res: Response) => BackupController.listBackups(req, res));
router.get('/:id', (req: AuthenticatedRequest, res: Response) => BackupController.getBackup(req, res));
router.delete('/:id', (req: AuthenticatedRequest, res: Response) => BackupController.deleteBackup(req, res));
router.get('/:id/download', (req: AuthenticatedRequest, res: Response) => BackupController.downloadBackup(req, res));

export default router;
