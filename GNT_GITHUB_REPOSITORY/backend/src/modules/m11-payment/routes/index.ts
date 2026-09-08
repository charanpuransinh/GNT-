// M11 Payment Module - Routes Index
// All M11 routes registered under /api/v1/payments
// (invoice routes हटा दिए — invoice M07/M08 की चीज़ है, M11 का नहीं)

import { Router } from 'express';
// Data Sense — पहले अलग module M21 था; owner फ़ैसला 2026-09-08 से M11 के अंदर।
import { dataSenseRoutes } from '../data-sense';
import bankAccountRoutes from './bankAccount.routes';
import paymentRoutes from './payment.routes';
import paymentMethodRoutes from './paymentMethod.routes';
import reconciliationRoutes from './reconciliation.routes';
import refundRoutes from './refund.routes';

const router = Router();

router.use('/transactions', paymentRoutes);
router.use('/refunds', refundRoutes);
router.use('/bank-accounts', bankAccountRoutes);
router.use('/reconciliations', reconciliationRoutes);
router.use('/methods', paymentMethodRoutes);
router.use('/data-sense', dataSenseRoutes);

export default router;
