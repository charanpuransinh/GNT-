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
router.get('/active', subscriptionController.getActive.bind(subscriptionController));
router.post('/cancel', subscriptionController.cancel.bind(subscriptionController));

export default router;
