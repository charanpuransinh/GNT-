// M11 Payment Module - Payment Method Routes

import { Router } from 'express';
import { PaymentMethodController } from '../controllers/paymentMethod.controller';
import { PaymentMethodService } from '../services/paymentMethod.service';
import { EventBus } from '../events/event.bus';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateMiddleware } from '../middleware/validate.middleware';
import { createPaymentMethodSchema, updatePaymentMethodSchema } from '../validation/schemas';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const eventBus = new EventBus();
const service = new PaymentMethodService(prisma, eventBus);
const controller = new PaymentMethodController(service);

const router = Router();

router.use(authMiddleware);

router.get('/', controller.listMethods);
router.get('/:id', controller.getMethod);
router.post('/', validateMiddleware(createPaymentMethodSchema), controller.createMethod);
router.patch('/:id', validateMiddleware(updatePaymentMethodSchema), controller.updateMethod);
router.delete('/:id', controller.deleteMethod);

export default router;
