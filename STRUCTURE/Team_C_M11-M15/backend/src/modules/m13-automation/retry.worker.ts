// ============================================================================
// GNT MASTER BLUEPRINT V2 — M13 AUTOMATION MODULE — RETRY WORKER
// Module: M13 | Layer: Queue Worker
// Queue: m13:retry
// ============================================================================

import { Worker, RedisOptions } from "bullmq";
import { M13_QUEUE_NAMES, M13_JOB_NAMES } from "../queue/queue.names";
import { workflowEngineService } from "../services/workflow-engine.service";
import { jobProcessorService } from "../services/job-processor.service";
import { M13JobStatus } from "../types/m13.types";

const redisConnection: RedisOptions = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

export const retryWorker = new Worker(
  M13_QUEUE_NAMES.RETRY,
  async (job) => {
    const { name, data } = job;

    if (name === M13_JOB_NAMES.HANDLE_RETRY) {
      const { jobId, workflowId } = data;

      // Reset job status to pending and re-trigger workflow
      await jobProcessorService.updateJobStatus(jobId, M13JobStatus.PENDING);
      await workflowEngineService.executeWorkflow(jobId);
    } else {
      throw new Error(`[M13] Unknown job name in retry worker: ${name}`);
    }
  },
  { connection: redisConnection, concurrency: 2 }
);

retryWorker.on("completed", (job) => {
  console.log(`[M13] Retry job completed: ${job.id}`);
});

retryWorker.on("failed", (job, err) => {
  console.error(`[M13] Retry job failed: ${job?.id}, error: ${err.message}`);
});
