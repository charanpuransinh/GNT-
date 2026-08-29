// ============================================================================
// GNT MASTER BLUEPRINT V2 — M13 AUTOMATION MODULE — EVENT HANDLER
// Module: M13 | Layer: Event Infrastructure
// Pattern: Event-driven Automation Hooks
// ============================================================================

import { M13EventPayload } from "../types/m13.types";
import { triggerEvaluatorService } from "../services/trigger-evaluator.service";
import { workflowEngineService } from "../services/workflow-engine.service";

export class EventHandler {
  /**
   * PUBLIC API: Handle incoming events from other modules.
   * Called by: Event bus / message broker (M18 Integration Module).
   * Cross-module rule: Other modules emit events; M13 evaluates triggers.
   */
  async handleIncomingEvent(event: M13EventPayload): Promise<void> {
    const matchedWorkflowIds = await triggerEvaluatorService.evaluateEventTrigger(event);

    for (const workflowId of matchedWorkflowIds) {
      await workflowEngineService.triggerWorkflow(workflowId, event.data);
    }
  }

  /**
   * PUBLIC API: Subscribe to event topics.
   * Called by: M13 module initialization.
   * NOT SPECIFIED: Event bus subscription mechanism per M18 v2.1
   */
  subscribeToEvents(): void {
    // NOT SPECIFIED: Event bus integration pattern v2.1
    // Placeholder: Subscription logic to be wired by M18 Integration Module
    console.log("[M13] Event subscriptions registered");
  }

  /**
   * PUBLIC API: Unsubscribe from event topics.
   */
  unsubscribeFromEvents(): void {
    // NOT SPECIFIED: Event bus unsubscription pattern v2.1
    console.log("[M13] Event subscriptions removed");
  }
}

export const eventHandler = new EventHandler();
