// ============================================================================
// GNT MASTER BLUEPRINT V2 — M13 AUTOMATION MODULE — JOB PROCESSOR SERVICE
// Module: M13 | Layer: Service
// Pattern: Job status tracking and lifecycle management
// ============================================================================

import { PrismaClient } from "@prisma/client";
import { M13JobStatus } from "../types/m13.types";

const prisma = new PrismaClient();

export class JobProcessorService {
  /**
   * PUBLIC API: Get job by ID with logs.
   * Called by: Other modules via M13 PUBLIC Service interface.
   */
  async getJob(jobId: string) {
    return prisma.m13Job.findUnique({
      where: { id: jobId },
      include: { logs: { orderBy: { createdAt: "asc" } } },
    });
  }

  /**
   * PUBLIC API: List jobs for a workflow.
   */
  async listJobs(workflowId: string, status?: M13JobStatus) {
    return prisma.m13Job.findMany({
      where: {
        workflowId,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { logs: { take: 5, orderBy: { createdAt: "desc" } } },
    });
  }

  /**
   * INTERNAL: Update job status.
   */
  async updateJobStatus(
    jobId: string,
    status: M13JobStatus,
    result?: Record<string, unknown>,
    error?: string
  ): Promise<void> {
    const data: Record<string, unknown> = { status };

    if (result !== undefined) {
      data.result = result;
    }
    if (error !== undefined) {
      data.error = error;
    }
    if (status === M13JobStatus.COMPLETED || status === M13JobStatus.FAILED) {
      data.completedAt = new Date();
    }

    await prisma.m13Job.update({
      where: { id: jobId },
      data,
    });
  }

  /**
   * PUBLIC API: Cancel a pending or running job.
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const job = await prisma.m13Job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return false;
    }

    if (job.status === M13JobStatus.COMPLETED || job.status === M13JobStatus.FAILED) {
      return false;
    }

    await prisma.m13Job.update({
      where: { id: jobId },
      data: { status: M13JobStatus.CANCELLED, completedAt: new Date() },
    });

    return true;
  }

  /**
   * INTERNAL: Log job event.
   */
  async logJobEvent(
    jobId: string,
    level: string,
    message: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await prisma.m13JobLog.create({
      data: {
        jobId,
        level,
        message,
        metadata: metadata || {},
      },
    });
  }
}

export const jobProcessorService = new JobProcessorService();
