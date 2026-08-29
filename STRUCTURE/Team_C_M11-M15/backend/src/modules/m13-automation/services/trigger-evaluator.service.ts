// ============================================================================
// GNT MASTER BLUEPRINT V2 — M13 AUTOMATION MODULE — TRIGGER EVALUATOR SERVICE
// Module: M13 | Layer: Service
// Pattern: Evaluate trigger conditions before action execution
// ============================================================================

import { PrismaClient } from "@prisma/client";
import { M13EventPayload } from "../types/m13.types";

const prisma = new PrismaClient();

export class TriggerEvaluatorService {
  /**
   * PUBLIC API: Evaluate if an event matches any active trigger.
   * Called by: EventHandler or other modules via M13 PUBLIC interface.
   */
  async evaluateEventTrigger(event: M13EventPayload): Promise<string[]> {
    const triggers = await prisma.m13Trigger.findMany({
      where: {
        isActive: true,
        type: "EVENT",
      },
      include: { workflow: true },
    });

    const matchedWorkflowIds: string[] = [];

    for (const trigger of triggers) {
      const config = trigger.config as Record<string, unknown>;
      const eventName = config.eventName as string;

      if (eventName && eventName === event.eventName) {
        matchedWorkflowIds.push(trigger.workflowId);
      }
    }

    // NOT SPECIFIED: Advanced condition evaluation (filters, expressions) v2.1
    return matchedWorkflowIds;
  }

  /**
   * PUBLIC API: Evaluate schedule triggers.
   * Called by: SchedulerService.
   */
  async evaluateScheduleTrigger(scheduleId: string): Promise<string | null> {
    const schedule = await prisma.m13Schedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule || !schedule.isActive) {
      return null;
    }

    return schedule.workflowId;
  }

  /**
   * PUBLIC API: Evaluate manual trigger.
   * Called by: WorkflowController (manual run endpoint).
   */
  async evaluateManualTrigger(workflowId: string): Promise<boolean> {
    const workflow = await prisma.m13Workflow.findUnique({
      where: { id: workflowId },
      include: { triggers: true },
    });

    if (!workflow || !workflow.isActive) {
      return false;
    }

    const hasManualTrigger = workflow.triggers.some(
      (t) => t.type === "MANUAL" && t.isActive
    );

    return hasManualTrigger;
  }
}

export const triggerEvaluatorService = new TriggerEvaluatorService();
