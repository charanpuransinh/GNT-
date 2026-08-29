import { Router } from 'express';
import { ConflictController } from '../controllers/conflict.controller';

const router = Router();

router.get('/', ConflictController.listConflicts);
router.get('/stats', ConflictController.getStats);
router.get('/:id', ConflictController.getConflict);
router.post('/:id/resolve', ConflictController.resolveConflict);
router.post('/bulk-resolve', ConflictController.bulkResolve);
router.post('/auto-resolve/:jobId', ConflictController.autoResolve);

export default router;
