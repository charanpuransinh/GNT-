// M11 Payment Module - Reconciliation Routes

import { Router } from 'express';
import { ReconciliationController } from '../controllers/reconciliation.controller';
import { ReconciliationService } from '../services/reconciliation.service';
import { EventBus } from '../events/event.bus';
import { validateMiddleware } from '../middleware/validate.middleware';
import { createReconciliationSchema } from '../validators/schemas';
import { prisma } from '../../../common/config/prisma';

const eventBus = new EventBus();
const service = new ReconciliationService(prisma, eventBus);
const controller = new ReconciliationController(service);

const router = Router();

router.get('/', controller.listReconciliations);
router.get('/:id', controller.getReconciliation);
router.post('/', validateMiddleware(createReconciliationSchema), controller.createReconciliation);
router.post('/:id/upload-statement', controller.uploadStatement);
router.post('/:id/auto-match', controller.autoMatch);
router.patch('/items/:itemId', controller.resolveItem);

export default router;
