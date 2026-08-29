// ============================================================================
// GNT MASTER BLUEPRINT V2 — M13 AUTOMATION — MODULE ENTRY POINT
// Module: M13 | Layer: Module Index
// ============================================================================

import { Router } from "express";
import workflowRoutes from "./routes/workflow.routes";
import jobRoutes from "./routes/job.routes";
import scheduleRoutes from "./routes/schedule.routes";
import { schedulerService } from "./services/scheduler.service";
import { eventHandler } from "./events/event.handler";
import { m13ErrorHandler } from "./middleware/m13.middleware";
import { closeM13Queues } from "./queue.setup";

/**
 * Initialize and mount M13 Automation Module.
 * Called by: Main Express app (M01 Foundation) during bootstrap.
 */
export function initM13Module(): Router {
  const router = Router();

  // Mount sub-routes under /m13 prefix
  router.use("/workflows", workflowRoutes);
  router.use("/jobs", jobRoutes);
  router.use("/schedules", scheduleRoutes);

  // Module-level error handler (must be last)
  router.use(m13ErrorHandler);

  // Start background services
  schedulerService.startScheduler();
  eventHandler.subscribeToEvents();

  console.log("[M13] Automation Module initialized");

  return router;
}

/**
 * Graceful shutdown for M13 module.
 * Called by: Main app on SIGTERM/SIGINT.
 */
export async function shutdownM13Module(): Promise<void> {
  schedulerService.stopScheduler();
  eventHandler.unsubscribeFromEvents();
  await closeM13Queues();
  console.log("[M13] Automation Module shut down gracefully");
}

// PUBLIC Service exports for cross-module consumption
export { workflowEngineService } from "./services/workflow-engine.service";
export { triggerEvaluatorService } from "./services/trigger-evaluator.service";
export { actionExecutorService } from "./services/action-executor.service";
export { jobProcessorService } from "./services/job-processor.service";
export { schedulerService } from "./services/scheduler.service";
export { retryHandlerService } from "./services/retry-handler.service";
export { eventHandler } from "./events/event.handler";
export { m13EventEmitter } from "./events/event.emitter";
export * from "./types/m13.types";
