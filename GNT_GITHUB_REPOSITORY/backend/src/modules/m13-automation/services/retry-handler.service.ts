// ============================================================================
// GNT MASTER BLUEPRINT V2 — M13 AUTOMATION MODULE — RETRY HANDLER SERVICE
// Module: M13 | Layer: Service
// Pattern: Retry / Failure Handling with exponential backoff
// ============================================================================

import { PrismaClient } from "@prisma/client";
import { M13JobStatus } from "../types/m13.types";
import { M13_QUEUE_NAMES, M13_JOB_NAMES } from "../queue/queue.names";
import { getM13Queue } from "../queue/queue.setup";
import { M13_CONFIG } from "../config/m13.config";

const prisma = new PrismaClient();

export class RetryHandlerService {
  /**
   * PUBLIC API: Retry a failed job.
   * Called by: Other modules via M13 PUBLIC Service interface.
   */
  async retryJob(jobId: string): Promise<boolean> {
    const job = await prisma.m13Job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return false;
    }

    if (job.status !== M13JobStatus.FAILED && job.status !== M13JobStatus.RETRYING) {
      return false;
    }

    if (job.retryCount >= job.maxRetries) {
      await this.markPermanentlyFailed(jobId, "Max retries exceeded");
      return false;
    }

    const newRetryCount = job.retryCount + 1;
    const delay = this.calculateRetryDelay(newRetryCount);

    await prisma.m13Job.update({
      where: { id: jobId },
      data: {
        status: M13JobStatus.RETRYING,
        retryCount: newRetryCount,
        error: null,
      },
    });

    // Enqueue retry job with delay
    const queue = getM13Queue(M13_QUEUE_NAMES.RETRY);
    await queue.add(
      M13_JOB_NAMES.HANDLE_RETRY,
      { jobId, workflowId: job.workflowId, retryCount: newRetryCount },
      { delay }
    );

    return true;
  }

  /**
   * INTERNAL: Auto-retry on failure.
   * Called by: WorkflowWorker on action failure.
   */
  async autoRetry(jobId: string): Promise<void> {
    const success = await this.retryJob(jobId);
    if (!success) {
      await this.markPermanentlyFailed(jobId, "Auto-retry failed");
    }
  }

  /**
   * INTERNAL: Mark job as permanently failed.
   */
  private async markPermanentlyFailed(jobId: string, reason: string): Promise<void> {
    await prisma.m13Job.update({
      where: { id: jobId },
      data: {
        status: M13JobStatus.FAILED,
        error: reason,
        completedAt: new Date(),
      },
    });

    await prisma.m13JobLog.create({
      data: {
        jobId,
        level: "ERROR",
        message: `Permanently failed: ${reason}`,
      },
    });
  }

  /**
   * INTERNAL: Calculate retry delay with exponential backoff.
   */
  private calculateRetryDelay(retryCount: number): number {
    const baseDelay = M13_CONFIG.DEFAULT_RETRY_DELAY_MS;
    return baseDelay * Math.pow(2, retryCount - 1);
  }
}

export const retryHandlerService = new RetryHandlerService();
