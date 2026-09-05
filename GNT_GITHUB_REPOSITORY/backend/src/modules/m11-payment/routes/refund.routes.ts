// M11 Payment Module - Refund Routes

import { Router } from 'express';
import { RefundController } from '../controllers/refund.controller';
import { RefundService } from '../services/refund.service';
// पहले M11 का अपना private EventBus था — हर route file अपना अलग instance बनाती थी,
// यानी publish किया हुआ कोई भी event कहीं पहुँचता ही नहीं था (कोई listener उसी instance
// को कभी नहीं पकड़ सकता)। अब साझा bus, जिस पर M07/M08/M10 पहले से हैं।
import { eventBus } from '@/common/events/event-bus';
import { validateMiddleware } from '../middleware/validate.middleware';
import { createRefundSchema, updateRefundSchema } from '../validators/schemas';
import { prisma } from '../../../common/config/prisma';

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
