// M11 Payment Module - Invoice Routes

import { Router } from 'express';
import { InvoiceController } from '../controllers/invoice.controller';
import { InvoiceService } from '../services/invoice.service';
import { EventBus } from '../events/event.bus';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateMiddleware } from '../middleware/validate.middleware';
import { createInvoiceSchema, updateInvoiceSchema } from '../validation/schemas';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const eventBus = new EventBus();
const service = new InvoiceService(prisma, eventBus);
const controller = new InvoiceController(service);

const router = Router();

router.use(authMiddleware);

router.get('/dashboard', controller.getDashboardStats);
router.get('/overdue', controller.getOverdueInvoices);
router.get('/', controller.listInvoices);
router.get('/number/:number', controller.getInvoiceByNumber);
router.get('/:id', controller.getInvoice);
router.post('/', validateMiddleware(createInvoiceSchema), controller.createInvoice);
router.patch('/:id', validateMiddleware(updateInvoiceSchema), controller.updateInvoice);
router.post('/:id/send', controller.sendInvoice);
router.post('/:id/cancel', controller.cancelInvoice);
router.delete('/:id', controller.deleteInvoice);

export default router;
