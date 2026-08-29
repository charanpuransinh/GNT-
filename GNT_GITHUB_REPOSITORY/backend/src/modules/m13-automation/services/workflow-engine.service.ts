// ============================================================================
// GNT MASTER BLUEPRINT V2 — M13 AUTOMATION MODULE — WORKFLOW ENGINE SERVICE
// Module: M13 | Layer: Service (PUBLIC)
// Pattern: Trigger → Condition → Action
// ============================================================================

import { PrismaClient } from "@prisma/client";
import { M13JobStatus, M13WorkflowContext } from "../types/m13.types";
import { M13_QUEUE_NAMES, M13_JOB_NAMES } from "../queue/queue.names";
import { getM13Queue } from "../queue/queue.setup";
import { M13_CONFIG } from "../config/m13.config";

const prisma = new PrismaClient();

export class WorkflowEngineService {
  /**
   * PUBLIC API: Trigger a workflow execution.
   * Called by: Other modules via M13 PUBLIC Service interface.
   */
  async triggerWorkflow(
    workflowId: string,
    payload: Record<string, unknown> = {}
  ): Promise<string> {
    const workflow = await prisma.m13Workflow.findUnique({
      where: { id: workflowId },
      include: { triggers: true, actions: true },
    });

    if (!workflow) {
      throw new Error(`[M13] Workflow not found: ${workflowId}`);
    }

    if (!workflow.isActive) {
      throw new Error(`[M13] Workflow is inactive: ${workflowId}`);
    }

    // Create job record
    const job = await prisma.m13Job.create({
      data: {
        workflowId,
        status: M13JobStatus.PENDING,
        payload,
        maxRetries: M13_CONFIG.DEFAULT_MAX_RETRIES,
      },
    });

    // Enqueue workflow execution
    const queue = getM13Queue(M13_QUEUE_NAMES.WORKFLOW);
    await queue.add(M13_JOB_NAMES.EXECUTE_WORKFLOW, {
      jobId: job.id,
      workflowId,
      payload,
    });

    return job.id;
  }

  /**
   * INTERNAL: Execute workflow actions sequentially.
   * Called by: WorkflowWorker ONLY.
   */
  async executeWorkflow(jobId: string): Promise<void> {
    const job = await prisma.m13Job.findUnique({
      where: { id: jobId },
      include: { workflow: { include: { actions: true } } },
    });

    if (!job) {
      throw new Error(`[M13] Job not found: ${jobId}`);
    }

    await prisma.m13Job.update({
      where: { id: jobId },
      data: { status: M13JobStatus.RUNNING, startedAt: new Date() },
    });

    const context: M13WorkflowContext = {
      workflowId: job.workflowId,
      jobId: job.id,
      payload: (job.payload as Record<string, unknown>) || {},
      metadata: {},
    };

    const actions = job.workflow.actions
      .filter((a) => a.isActive)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    try {
      for (const action of actions) {
        // Enqueue each action for execution
        const queue = getM13Queue(M13_QUEUE_NAMES.WORKFLOW);
        await queue.add(M13_JOB_NAMES.EXECUTE_ACTION, {
          jobId,
          actionId: action.id,
          context,
        });
      }

      // NOT SPECIFIED: Action completion tracking mechanism v2.1
      // For now, mark job completed after enqueueing all actions
      await prisma.m13Job.update({
        where: { id: jobId },
        data: {
          status: M13JobStatus.COMPLETED,
          completedAt: new Date(),
        },
      });
    } catch (error) {
      await this.handleExecutionFailure(jobId, error);
    }
  }

  /**
   * INTERNAL: Handle workflow execution failure.
   */
  private async handleExecutionFailure(
    jobId: string,
    error: unknown
  ): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error);

    await prisma.m13Job.update({
      where: { id: jobId },
      data: {
        status: M13JobStatus.FAILED,
        error: errorMessage,
        completedAt: new Date(),
      },
    });

    // Emit failure event
    const eventQueue = getM13Queue(M13_QUEUE_NAMES.EVENT);
    await eventQueue.add(M13_JOB_NAMES.EMIT_EVENT, {
      eventName: "m13:job:failed",
      data: { jobId, error: errorMessage },
    });
  }
}

export const workflowEngineService = new WorkflowEngineService();
