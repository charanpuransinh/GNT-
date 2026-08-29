// M11 Payment Module - Routes Index
// All M11 routes registered under /api/v1/payments

import { Router } from 'express';
import paymentRoutes from './payment.routes';
import invoiceRoutes from './invoice.routes';
import refundRoutes from './refund.routes';
import bankAccountRoutes from './bankAccount.routes';
import reconciliationRoutes from './reconciliation.routes';
import paymentMethodRoutes from './paymentMethod.routes';

const router = Router();

router.use('/transactions', paymentRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/refunds', refundRoutes);
router.use('/bank-accounts', bankAccountRoutes);
router.use('/reconciliations', reconciliationRoutes);
router.use('/methods', paymentMethodRoutes);

export default router;
