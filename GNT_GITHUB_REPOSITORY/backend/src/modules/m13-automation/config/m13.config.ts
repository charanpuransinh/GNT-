// ============================================================================
// GNT MASTER BLUEPRINT V2 — M13 AUTOMATION MODULE — CONFIGURATION
// Module: M13 | Layer: Config
// ============================================================================

export const M13_CONFIG = {
  QUEUE_PREFIX: "m13",
  DEFAULT_MAX_RETRIES: 3,
  DEFAULT_RETRY_DELAY_MS: 5000,
  DEFAULT_JOB_TIMEOUT_MS: 30000,
  SCHEDULER_CHECK_INTERVAL_MS: 60000,
  // NOT SPECIFIED: Additional config values per environment v2.1
} as const;

export const M13_QUEUE_NAMES = {
  WORKFLOW: "m13:workflow",
  SCHEDULED: "m13:scheduled",
  RETRY: "m13:retry",
  EVENT: "m13:event",
} as const;

export const M13_EVENT_TOPICS = {
  WORKFLOW_TRIGGERED: "m13:workflow:triggered",
  JOB_COMPLETED: "m13:job:completed",
  JOB_FAILED: "m13:job:failed",
  SCHEDULE_FIRED: "m13:schedule:fired",
} as const;
