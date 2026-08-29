// M11 Payment Module - Refund Routes

import { Router } from 'express';
import { RefundController } from '../controllers/refund.controller';
import { RefundService } from '../services/refund.service';
import { EventBus } from '../events/event.bus';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateMiddleware } from '../middleware/validate.middleware';
import { createRefundSchema, updateRefundSchema } from '../validators/schemas';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const eventBus = new EventBus();
const service = new RefundService(prisma, eventBus);
const controller = new RefundController(service);

const router = Router();

router.use(authMiddleware);

router.get('/', controller.listRefunds);
router.get('/:id', controller.getRefund);
router.post('/', validateMiddleware(createRefundSchema), controller.createRefund);
router.post('/:id/approve', controller.approveRefund);
router.post('/:id/reject', controller.rejectRefund);
router.patch('/:id', validateMiddleware(updateRefundSchema), controller.updateRefund);
router.delete('/:id', controller.deleteRefund);

export default router;
