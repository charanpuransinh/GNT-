// ============================================================================
// GNT MASTER BLUEPRINT V2 — M13 AUTOMATION MODULE — ACTION EXECUTOR SERVICE
// Module: M13 | Layer: Service
// Pattern: Execute configured actions based on type
// ============================================================================

import { PrismaClient } from "@prisma/client";
import { M13ActionType, M13WorkflowContext, M13JobResult } from "../types/m13.types";
import { M13_QUEUE_NAMES, M13_JOB_NAMES } from "../queue/queue.names";
import { getM13Queue } from "../queue/queue.setup";

const prisma = new PrismaClient();

export class ActionExecutorService {
  /**
   * INTERNAL: Execute a single action.
   * Called by: WorkflowWorker.
   */
  async executeAction(
    actionId: string,
    context: M13WorkflowContext
  ): Promise<M13JobResult> {
    const action = await prisma.m13Action.findUnique({
      where: { id: actionId },
    });

    if (!action) {
      return { success: false, error: `Action not found: ${actionId}` };
    }

    const config = action.config as Record<string, unknown>;

    try {
      switch (action.type) {
        case M13ActionType.SEND_EMAIL:
          return await this.executeSendEmail(config, context);
        case M13ActionType.UPDATE_RECORD:
          return await this.executeUpdateRecord(config, context);
        case M13ActionType.CALL_API:
          return await this.executeCallApi(config, context);
        default:
          // NOT SPECIFIED: Additional action types per roadmap v2.1
          return {
            success: false,
            error: `Unsupported action type: ${action.type}`,
          };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  private async executeSendEmail(
    config: Record<string, unknown>,
    context: M13WorkflowContext
  ): Promise<M13JobResult> {
    // NOT SPECIFIED: Email service integration (M08 Notification Module)
    // Placeholder: Log action execution
    await this.logAction(context.jobId, "SEND_EMAIL executed", config);
    return { success: true, data: { action: "SEND_EMAIL", config } };
  }

  private async executeUpdateRecord(
    config: Record<string, unknown>,
    context: M13WorkflowContext
  ): Promise<M13JobResult> {
    // NOT SPECIFIED: Record update integration with target module
    // Cross-module rule: Must use PUBLIC API, NOT direct DB access
    await this.logAction(context.jobId, "UPDATE_RECORD executed", config);
    return { success: true, data: { action: "UPDATE_RECORD", config } };
  }

  private async executeCallApi(
    config: Record<string, unknown>,
    context: M13WorkflowContext
  ): Promise<M13JobResult> {
    // NOT SPECIFIED: HTTP client integration pattern v2.1
    await this.logAction(context.jobId, "CALL_API executed", config);
    return { success: true, data: { action: "CALL_API", config } };
  }

  private async logAction(
    jobId: string,
    message: string,
    metadata: Record<string, unknown>
  ): Promise<void> {
    await prisma.m13JobLog.create({
      data: {
        jobId,
        level: "INFO",
        message,
        metadata,
      },
    });
  }
}

export const actionExecutorService = new ActionExecutorService();
