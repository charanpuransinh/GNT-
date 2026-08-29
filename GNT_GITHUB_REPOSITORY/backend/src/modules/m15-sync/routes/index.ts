import { Router } from 'express';
import syncRoutes from './sync.routes';
import conflictRoutes from './conflict.routes';
import backupRoutes from './backup.routes';
import integrationRoutes from './integration.routes';

const router = Router();

router.use('/sync', syncRoutes);
router.use('/conflicts', conflictRoutes);
router.use('/backups', backupRoutes);
router.use('/integrations', integrationRoutes);

export default router;
