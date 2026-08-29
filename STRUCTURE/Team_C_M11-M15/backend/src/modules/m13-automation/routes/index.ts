// ⚠️ WIRING AUDIT NOTE (2026-08-28) — यह file M13 के असली/wired entry point (index.ts -> workflow.routes/job.routes/schedule.routes
// -> workflow.controller.ts/job.controller.ts/schedule.controller.ts + scheduler.service.ts + event.handler.ts) से जुड़ी हुई NAHI है।
// यह एक दूसरा, अलग (duplicate) scaffold लगता है जो कभी real path से wire नहीं हुआ, और इसमें broken imports हैं
// (जैसे '../../../m02-auth/src/middleware', '../../../m03-core/src/middleware', '../engine/WorkflowEngine',
// '../scheduler/SchedulerService' — ये paths repo में कहीं मौजूद नहीं हैं)।
// FIX नहीं किया गया — सिर्फ FLAG किया गया, क्योंकि silent delete/rename मना है (Krisna's rule)।
// Krisna से confirm चाहिए: इसे हटाना है, या इसमें जो useful लॉजिक (जैसे WebhookController का HMAC verification) है
// उसे असली wired path में merge करना है।

import { Router } from 'express';
import { WorkflowController } from '../controllers/WorkflowController';
import { ExecutionController } from '../controllers/ExecutionController';
import { WebhookController } from '../controllers/WebhookController';
import { authMiddleware } from '../../../m02-auth/src/middleware';
import { rateLimit } from '../../../m03-core/src/middleware';

const router = Router();

// Public webhook (HMAC verified internally)
router.post('/webhooks/automation/:workflowId', WebhookController.receive);

// Protected routes
router.use(authMiddleware);

router.get('/workflows', (req, res) => req.app.get('workflowController').list(req, res));
router.post('/workflows', (req, res) => req.app.get('workflowController').create(req, res));
router.get('/workflows/:id', (req, res) => req.app.get('workflowController').get(req, res));
router.put('/workflows/:id', (req, res) => req.app.get('workflowController').update(req, res));
router.delete('/workflows/:id', (req, res) => req.app.get('workflowController').delete(req, res));
router.post('/workflows/:id/execute', rateLimit({ max: 10, window: 60000 }), (req, res) => req.app.get('workflowController').execute(req, res));
router.post('/workflows/:id/toggle', (req, res) => req.app.get('workflowController').toggle(req, res));

router.get('/executions', (req, res) => req.app.get('executionController').list(req, res));
router.get('/executions/:id', (req, res) => req.app.get('executionController').get(req, res));
router.post('/executions/:id/cancel', (req, res) => req.app.get('executionController').cancel(req, res));

router.get('/scheduled-jobs', (req, res) => req.app.get('executionController').listJobs(req, res));
router.post('/scheduled-jobs', (req, res) => req.app.get('executionController').createJob(req, res));
router.delete('/scheduled-jobs/:id', (req, res) => req.app.get('executionController').deleteJob(req, res));

router.get('/actions/definitions', (req, res) => {
  res.json({ data: req.app.get('actionRegistry').getAll() });
});

export default router;
