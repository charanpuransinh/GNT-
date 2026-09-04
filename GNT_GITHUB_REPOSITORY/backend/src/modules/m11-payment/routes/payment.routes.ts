// M11 Payment Module - Payment Routes
// (auth/tenant मुख्य app की global middleware से — module-level header-auth हटाया)

import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { PaymentService } from '../services/payment.service';
import { EventBus } from '../events/event.bus';
import { validateMiddleware } from '../middleware/validate.middleware';
import { createPaymentSchema, updatePaymentSchema, processPaymentSchema } from '../validators/schemas';
import { prisma } from '../../../common/config/prisma';

const eventBus = new EventBus();
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
