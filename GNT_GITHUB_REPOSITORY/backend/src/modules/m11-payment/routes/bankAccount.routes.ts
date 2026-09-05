// M11 Payment Module - Bank Account Routes

import { Router } from 'express';
import { BankAccountController } from '../controllers/bankAccount.controller';
import { BankAccountService } from '../services/bankAccount.service';
// पहले M11 का अपना private EventBus था — हर route file अपना अलग instance बनाती थी,
// यानी publish किया हुआ कोई भी event कहीं पहुँचता ही नहीं था (कोई listener उसी instance
// को कभी नहीं पकड़ सकता)। अब साझा bus, जिस पर M07/M08/M10 पहले से हैं।
import { eventBus } from '@/common/events/event-bus';
import { validateMiddleware } from '../middleware/validate.middleware';
import { createBankAccountSchema, updateBankAccountSchema } from '../validators/schemas';
import { prisma } from '../../../common/config/prisma';

const service = new BankAccountService(prisma, eventBus);
const controller = new BankAccountController(service);

const router = Router();

router.get('/', controller.listAccounts);
router.get('/:id', controller.getAccount);
router.post('/', validateMiddleware(createBankAccountSchema), controller.createAccount);
router.patch('/:id', validateMiddleware(updateBankAccountSchema), controller.updateAccount);
router.delete('/:id', controller.deleteAccount);

export default router;
