// ============================================================================
// GNT MASTER BLUEPRINT V2 — M13 AUTOMATION MODULE — EVENT EMITTER
// Module: M13 | Layer: Event Infrastructure
// Pattern: Emit M13 events via real BullMQ queue (NOT in-memory)
// ============================================================================

import { M13_EVENT_TOPICS } from "../config/m13.config";
import { M13_QUEUE_NAMES, M13_JOB_NAMES } from "../queue/queue.names";
import { getM13Queue } from "../queue/queue.setup";

export class EventEmitter {
  /**
   * Emit an M13 event to the real event queue (Redis-backed BullMQ).
   * Other modules consume from this queue via M18 Integration Module.
   * Cross-module rule: M13 emits; other modules listen.
   */
  async emit(eventName: string, data: Record<string, unknown>): Promise<void> {
    const queue = getM13Queue(M13_QUEUE_NAMES.EVENT);
    await queue.add(M13_JOB_NAMES.EMIT_EVENT, {
      eventName,
      data,
      emittedAt: new Date().toISOString(),
      sourceModule: "M13",
    });
  }

  async emitJobCompleted(jobId: string, workflowId: string): Promise<void> {
    await this.emit(M13_EVENT_TOPICS.JOB_COMPLETED, { jobId, workflowId });
  }

  async emitJobFailed(jobId: string, workflowId: string, error: string): Promise<void> {
    await this.emit(M13_EVENT_TOPICS.JOB_FAILED, { jobId, workflowId, error });
  }

  async emitScheduleFired(scheduleId: string, workflowId: string): Promise<void> {
    await this.emit(M13_EVENT_TOPICS.SCHEDULE_FIRED, { scheduleId, workflowId });
  }
}

export const m13EventEmitter = new EventEmitter();
