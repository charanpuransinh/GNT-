import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/tenant.middleware';

import { ConflictController } from '../controllers/conflict.controller';

const router = Router();

router.get('/', (req: AuthenticatedRequest, res: Response) => ConflictController.listConflicts(req, res));
router.get('/stats', (req: AuthenticatedRequest, res: Response) => ConflictController.getStats(req, res));
router.get('/:id', (req: AuthenticatedRequest, res: Response) => ConflictController.getConflict(req, res));
router.post('/:id/resolve', (req: AuthenticatedRequest, res: Response) => ConflictController.resolveConflict(req, res));
router.post('/bulk-resolve', (req: AuthenticatedRequest, res: Response) => ConflictController.bulkResolve(req, res));
router.post('/auto-resolve/:jobId', (req: AuthenticatedRequest, res: Response) => ConflictController.autoResolve(req, res));

export default router;
