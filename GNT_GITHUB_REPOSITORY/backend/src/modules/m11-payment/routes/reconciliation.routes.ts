// M11 Payment Module - Reconciliation Routes

import { Router } from 'express';
import { ReconciliationController } from '../controllers/reconciliation.controller';
import { ReconciliationService } from '../services/reconciliation.service';
// पहले M11 का अपना private EventBus था — हर route file अपना अलग instance बनाती थी,
// यानी publish किया हुआ कोई भी event कहीं पहुँचता ही नहीं था (कोई listener उसी instance
// को कभी नहीं पकड़ सकता)। अब साझा bus, जिस पर M07/M08/M10 पहले से हैं।
import { eventBus } from '@/common/events/event-bus';
import { validateMiddleware } from '../middleware/validate.middleware';
import { createReconciliationSchema } from '../validators/schemas';
import { prisma } from '../../../common/config/prisma';

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
