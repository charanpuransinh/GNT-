import { Router } from 'express';
import { BackupController } from '../controllers/backup.controller';

const router = Router();

router.post('/', BackupController.createBackup);
router.get('/', BackupController.listBackups);
router.get('/:id', BackupController.getBackup);
router.delete('/:id', BackupController.deleteBackup);
router.get('/:id/download', BackupController.downloadBackup);

export default router;
