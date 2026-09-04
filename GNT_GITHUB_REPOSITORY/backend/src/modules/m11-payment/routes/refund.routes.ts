// M11 Payment Module - Refund Routes

import { Router } from 'express';
import { RefundController } from '../controllers/refund.controller';
import { RefundService } from '../services/refund.service';
import { EventBus } from '../events/event.bus';
import { validateMiddleware } from '../middleware/validate.middleware';
import { createRefundSchema, updateRefundSchema } from '../validators/schemas';
import { prisma } from '../../../common/config/prisma';

const eventBus = new EventBus();
const service = new RefundService(prisma, eventBus);
const controller = new RefundController(service);

const router = Router();

router.get('/', controller.listRefunds);
router.get('/:id', controller.getRefund);
router.post('/', validateMiddleware(createRefundSchema), controller.createRefund);
router.post('/:id/approve', controller.approveRefund);
router.post('/:id/reject', controller.rejectRefund);
router.patch('/:id', validateMiddleware(updateRefundSchema), controller.updateRefund);
router.delete('/:id', controller.deleteRefund);

export default router;
