// M13 Automation Module - Routes
// सब /api/v1/automation के नीचे (module-registry इसे वहाँ चढ़ाता है)

import { Router } from 'express';
import { AutomationController } from '../controllers/automation.controller';
import { SchedulerController } from '../controllers/scheduler.controller';
import { AutomationService } from '../services/automation.service';
import { prisma } from '@/common/config/prisma';
import { validateMiddleware } from '../middleware/m13.middleware';
import {
  createRuleSchema,
  updateRuleSchema,
  triggerRuleSchema,
  createScheduleSchema,
  updateScheduleSchema,
} from '../validators/automation.schema';

const automationService = new AutomationService(prisma);
const automationController = new AutomationController(automationService);
const schedulerController = new SchedulerController();

const router = Router();

// ─── Rules ───
router.get('/rules', automationController.listRules);
router.post('/rules', validateMiddleware(createRuleSchema), automationController.createRule);
router.get('/rules/:id', automationController.getRule);
router.patch('/rules/:id', validateMiddleware(updateRuleSchema), automationController.updateRule);
router.delete('/rules/:id', automationController.deleteRule);
router.post('/rules/:id/trigger', validateMiddleware(triggerRuleSchema), automationController.triggerRule);

// ─── Schedules ───
router.get('/schedules', schedulerController.listSchedules);
router.post('/schedules', validateMiddleware(createScheduleSchema), schedulerController.createSchedule);
router.patch('/schedules/:id', validateMiddleware(updateScheduleSchema), schedulerController.updateSchedule);
router.delete('/schedules/:id', schedulerController.deleteSchedule);
router.post('/schedules/:id/run', schedulerController.runScheduleNow);
router.get('/schedules/:id/executions', schedulerController.listJobExecutions);

// ─── Executions (सबका हिसाब) ───
router.get('/executions', automationController.listExecutions);

export default router;
