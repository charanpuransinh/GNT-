// ============================================================================
// GNT MASTER BLUEPRINT V2 — M13 AUTOMATION MODULE — QUEUE JOB NAMES
// Module: M13 | Layer: Queue Contracts
// ============================================================================

export const M13_JOB_NAMES = {
  EXECUTE_WORKFLOW: "m13:execute:workflow",
  EXECUTE_ACTION: "m13:execute:action",
  EVALUATE_TRIGGER: "m13:evaluate:trigger",
  PROCESS_SCHEDULE: "m13:process:schedule",
  HANDLE_RETRY: "m13:handle:retry",
  EMIT_EVENT: "m13:emit:event",
} as const;
