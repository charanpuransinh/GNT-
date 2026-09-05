// ============================================================================
// GNT MASTER BLUEPRINT V2 — M13 AUTOMATION — MODULE ENTRY POINT
// blueprint §7.13: Scheduler, Alerts, Reminders, Notification Center
// ============================================================================

import { Router } from 'express';
import automationRoutes from './routes/automation.routes';
import { schedulerService } from './services/scheduler.service';
import { registerAutomationEventHandlers } from './events/automation.handlers';

/**
 * M13 को main app में चढ़ाना (module-registry से बुलाया जाता है)।
 */
export function initM13Module(): Router {
  const router = Router();
  router.use('/', automationRoutes);
  schedulerService.startScheduler();
  registerAutomationEventHandlers();
  return router;
}

/** Server बंद होते वक़्त — timer साफ़ */
export function shutdownM13Module(): void {
  schedulerService.stopScheduler();
}

// PUBLIC exports — दूसरे modules सिर्फ़ यहीं से लेंगे (सीधे अंदर नहीं घुसेंगे)
export { AutomationService } from './services/automation.service';
export { schedulerService } from './services/scheduler.service';
export type {
  AutomationRuleView,
  CreateAutomationRuleDto,
  UpdateAutomationRuleDto,
  CreateScheduledJobDto,
  UpdateScheduledJobDto,
  AutomationAction,
  AutomationActionType,
  AutomationTriggerType,
  ExecutionStatus,
  JobExecutionLogView,
} from './types/m13.types';
