// ============================================================================
// GNT MASTER BLUEPRINT V2 — M13 AUTOMATION MODULE — CORE TYPES
// Module: M13 | Layer: Types
// ============================================================================

export enum M13TriggerType {
  EVENT = "EVENT",
  SCHEDULE = "SCHEDULE",
  MANUAL = "MANUAL",
}

export enum M13ActionType {
  SEND_EMAIL = "SEND_EMAIL",
  UPDATE_RECORD = "UPDATE_RECORD",
  CALL_API = "CALL_API",
  NOT_SPECIFIED = "NOT_SPECIFIED", // Additional types defined in roadmap v2.1
}

export enum M13JobStatus {
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  RETRYING = "RETRYING",
  CANCELLED = "CANCELLED",
}

export enum M13LogLevel {
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

export interface M13TriggerConfig {
  eventName?: string;
  cronExpression?: string;
  // NOT SPECIFIED: Additional trigger config fields per roadmap v2.1
}

export interface M13ActionConfig {
  endpoint?: string;
  method?: string;
  payload?: Record<string, unknown>;
  // NOT SPECIFIED: Additional action config fields per roadmap v2.1
}

export interface M13WorkflowContext {
  workflowId: string;
  jobId: string;
  payload: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export interface M13JobResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

export interface M13EventPayload {
  eventName: string;
  sourceModule: string;
  data: Record<string, unknown>;
  timestamp: Date;
}
