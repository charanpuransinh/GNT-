// ============================================================================
// GNT MASTER BLUEPRINT V2 — M13 AUTOMATION MODULE — WORKFLOW WORKER
// Module: M13 | Layer: Queue Worker
// Queue: m13:workflow
// ============================================================================

import { Worker, RedisOptions } from "bullmq";
import { M13_QUEUE_NAMES, M13_JOB_NAMES } from "../queue/queue.names";
import { workflowEngineService } from "../services/workflow-engine.service";
import { actionExecutorService } from "../services/action-executor.service";
import { jobProcessorService } from "../services/job-processor.service";
import { retryHandlerService } from "../services/retry-handler.service";

// NOT SPECIFIED: Redis connection config sourced from M04 Config Module
const redisConnection: RedisOptions = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

export const workflowWorker = new Worker(
  M13_QUEUE_NAMES.WORKFLOW,
  async (job) => {
    const { name, data } = job;

    switch (name) {
      case M13_JOB_NAMES.EXECUTE_WORKFLOW:
        await workflowEngineService.executeWorkflow(data.jobId);
        break;

      case M13_JOB_NAMES.EXECUTE_ACTION:
        const result = await actionExecutorService.executeAction(
          data.actionId,
          data.context
        );
        if (!result.success) {
          await jobProcessorService.logJobEvent(
            data.jobId,
            "ERROR",
            `Action failed: ${result.error}`,
            { actionId: data.actionId }
          );
          await retryHandlerService.autoRetry(data.jobId);
        }
        break;

      default:
        throw new Error(`[M13] Unknown job name in workflow worker: ${name}`);
    }
  },
  { connection: redisConnection, concurrency: 5 }
);

workflowWorker.on("completed", (job) => {
  console.log(`[M13] Workflow job completed: ${job.id}`);
});

workflowWorker.on("failed", (job, err) => {
  console.error(`[M13] Workflow job failed: ${job?.id}, error: ${err.message}`);
});
