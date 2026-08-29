// ============================================================================
// GNT MASTER BLUEPRINT V2 — M13 AUTOMATION MODULE — SCHEDULED WORKER
// Module: M13 | Layer: Queue Worker
// Queue: m13:scheduled
// ============================================================================

import { Worker, RedisOptions } from "bullmq";
import { M13_QUEUE_NAMES, M13_JOB_NAMES } from "./queue/queue.names";
import { triggerEvaluatorService } from "./services/trigger-evaluator.service";
import { workflowEngineService } from "./services/workflow-engine.service";

const redisConnection: RedisOptions = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

export const scheduledWorker = new Worker(
  M13_QUEUE_NAMES.SCHEDULED,
  async (job) => {
    const { name, data } = job;

    if (name === M13_JOB_NAMES.PROCESS_SCHEDULE) {
      const workflowId = await triggerEvaluatorService.evaluateScheduleTrigger(
        data.scheduleId
      );

      if (workflowId) {
        await workflowEngineService.triggerWorkflow(workflowId, {
          scheduleId: data.scheduleId,
          triggeredAt: data.triggeredAt,
        });
      }
    } else {
      throw new Error(`[M13] Unknown job name in scheduled worker: ${name}`);
    }
  },
  { connection: redisConnection, concurrency: 3 }
);

scheduledWorker.on("completed", (job) => {
  console.log(`[M13] Scheduled job completed: ${job.id}`);
});

scheduledWorker.on("failed", (job, err) => {
  console.error(`[M13] Scheduled job failed: ${job?.id}, error: ${err.message}`);
});
