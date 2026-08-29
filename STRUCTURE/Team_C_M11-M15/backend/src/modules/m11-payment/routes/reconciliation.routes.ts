// M11 Payment Module - Reconciliation Routes

import { Router } from 'express';
import { ReconciliationController } from '../controllers/reconciliation.controller';
import { ReconciliationService } from '../services/reconciliation.service';
import { EventBus } from '../events/event.bus';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateMiddleware } from '../middleware/validate.middleware';
import { createReconciliationSchema } from '../validation/schemas';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const eventBus = new EventBus();
const service = new ReconciliationService(prisma, eventBus);
const controller = new ReconciliationController(service);

const router = Router();

router.use(authMiddleware);

router.get('/', controller.listReconciliations);
router.get('/:id', controller.getReconciliation);
router.post('/', validateMiddleware(createReconciliationSchema), controller.createReconciliation);
router.post('/:id/upload-statement', controller.uploadStatement);
router.post('/:id/auto-match', controller.autoMatch);
router.patch('/items/:itemId', controller.resolveItem);

export default router;
