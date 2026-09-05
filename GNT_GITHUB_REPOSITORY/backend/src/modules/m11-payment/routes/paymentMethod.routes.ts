// M11 Payment Module - Payment Method Routes

import { Router } from 'express';
import { PaymentMethodController } from '../controllers/paymentMethod.controller';
import { PaymentMethodService } from '../services/paymentMethod.service';
// पहले M11 का अपना private EventBus था — हर route file अपना अलग instance बनाती थी,
// यानी publish किया हुआ कोई भी event कहीं पहुँचता ही नहीं था (कोई listener उसी instance
// को कभी नहीं पकड़ सकता)। अब साझा bus, जिस पर M07/M08/M10 पहले से हैं।
import { eventBus } from '@/common/events/event-bus';
import { validateMiddleware } from '../middleware/validate.middleware';
import { createPaymentMethodSchema, updatePaymentMethodSchema } from '../validators/schemas';
import { prisma } from '../../../common/config/prisma';

const service = new PaymentMethodService(prisma, eventBus);
const controller = new PaymentMethodController(service);

const router = Router();

router.get('/', controller.listMethods);
router.get('/:id', controller.getMethod);
router.post('/', validateMiddleware(createPaymentMethodSchema), controller.createMethod);
router.patch('/:id', validateMiddleware(updatePaymentMethodSchema), controller.updateMethod);
router.delete('/:id', controller.deleteMethod);

export default router;
