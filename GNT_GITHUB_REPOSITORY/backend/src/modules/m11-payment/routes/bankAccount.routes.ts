// M11 Payment Module - Bank Account Routes

import { Router } from 'express';
import { BankAccountController } from '../controllers/bankAccount.controller';
import { BankAccountService } from '../services/bankAccount.service';
import { EventBus } from '../events/event.bus';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateMiddleware } from '../middleware/validate.middleware';
import { createBankAccountSchema, updateBankAccountSchema } from '../validators/schemas';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const eventBus = new EventBus();
const service = new BankAccountService(prisma, eventBus);
const controller = new BankAccountController(service);

const router = Router();

router.use(authMiddleware);

router.get('/', controller.listAccounts);
router.get('/:id', controller.getAccount);
router.post('/', validateMiddleware(createBankAccountSchema), controller.createAccount);
router.patch('/:id', validateMiddleware(updateBankAccountSchema), controller.updateAccount);
router.delete('/:id', controller.deleteAccount);

export default router;
