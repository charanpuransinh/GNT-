// M11 Payment Module - Payment Routes
// (auth/tenant मुख्य app की global middleware से — module-level header-auth हटाया)

import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { PaymentService } from '../services/payment.service';
// पहले M11 का अपना private EventBus था — हर route file अपना अलग instance बनाती थी,
// यानी publish किया हुआ कोई भी event कहीं पहुँचता ही नहीं था (कोई listener उसी instance
// को कभी नहीं पकड़ सकता)। अब साझा bus, जिस पर M07/M08/M10 पहले से हैं।
import { eventBus } from '@/common/events/event-bus';
import { validateMiddleware } from '../middleware/validate.middleware';
import { createPaymentSchema, updatePaymentSchema, processPaymentSchema } from '../validators/schemas';
import { prisma } from '../../../common/config/prisma';

const service = new PaymentService(prisma, eventBus);
const controller = new PaymentController(service);

const router = Router();

router.get('/dashboard', controller.getDashboardStats);
router.get('/', controller.listPayments);
router.get('/:id', controller.getPayment);
router.post('/', validateMiddleware(createPaymentSchema), controller.createPayment);
router.post('/:id/process', validateMiddleware(processPaymentSchema), controller.processPayment);
router.post('/:id/fail', controller.failPayment);
router.post('/:id/cancel', controller.cancelPayment);
router.patch('/:id', validateMiddleware(updatePaymentSchema), controller.updatePayment);
router.delete('/:id', controller.deletePayment);

export default router;
