// M22 — Subscription routes
import { Router } from 'express';
import { subscriptionController } from '../controllers/subscription.controller';

const router = Router();

// plan (public पढ़ने के लिए भी काम — frontend pricing page बिना login देख सकता है)
router.get('/plans', subscriptionController.listPlans.bind(subscriptionController));
router.post('/plans', subscriptionController.createPlan.bind(subscriptionController));
router.patch('/plans/:id', subscriptionController.updatePlan.bind(subscriptionController));

// company subscription (auth + tenant chain से सुरक्षित)
router.post('/subscribe', subscriptionController.subscribe.bind(subscriptionController));
router.post('/trial', subscriptionController.startTrial.bind(subscriptionController));
router.get('/active', subscriptionController.getActive.bind(subscriptionController));
router.post('/cancel', subscriptionController.cancel.bind(subscriptionController));
router.get('/access/:feature', subscriptionController.checkAccess.bind(subscriptionController));

// billing
router.post('/invoices/generate', subscriptionController.generateInvoice.bind(subscriptionController));
router.get('/invoices', subscriptionController.listInvoices.bind(subscriptionController));
router.post('/invoices/:id/pay', subscriptionController.payInvoice.bind(subscriptionController));

// billing lifecycle — cron / platform-admin (renew + overdue + expire)
router.post('/billing/run', subscriptionController.runBilling.bind(subscriptionController));

export default router;
