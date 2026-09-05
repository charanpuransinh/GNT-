// ============================================================================
// GNT MASTER BLUEPRINT V2 — M13 AUTOMATION — CORE TYPES
// blueprint §7.13: automation_rule, scheduled_job, job_execution_log
// ============================================================================

export type AutomationTriggerType = 'EVENT' | 'SCHEDULE' | 'MANUAL';

export type AutomationActionType = 'NOTIFY' | 'WEBHOOK' | 'LOG';

export interface AutomationAction {
  type: AutomationActionType;
  config: Record<string, unknown>;
}

export interface AutomationRuleView {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  triggerType: AutomationTriggerType;
  triggerEvent: string | null;
  triggerConfig: Record<string, unknown> | null;
  actions: AutomationAction[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface CreateAutomationRuleDto {
  name: string;
  description?: string;
  triggerType: AutomationTriggerType;
  triggerEvent?: string;
  triggerConfig?: Record<string, unknown>;
  actions: AutomationAction[];
  isActive?: boolean;
}

export interface UpdateAutomationRuleDto {
  name?: string;
  description?: string;
  triggerEvent?: string;
  triggerConfig?: Record<string, unknown>;
  actions?: AutomationAction[];
  isActive?: boolean;
}

export interface ScheduledJobView {
  id: string;
  tenantId: string;
  ruleId: string;
  name: string;
  cronExpr: string;
  timezone: string;
  payload: Record<string, unknown> | null;
  status: 'ACTIVE' | 'PAUSED';
  lastRunAt: Date | null;
  nextRunAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface CreateScheduledJobDto {
  ruleId: string;
  name: string;
  cronExpr: string;
  timezone?: string;
  payload?: Record<string, unknown>;
}

export interface UpdateScheduledJobDto {
  name?: string;
  cronExpr?: string;
  timezone?: string;
  payload?: Record<string, unknown> | null;
  status?: 'ACTIVE' | 'PAUSED';
  lastRunAt?: Date | null;
  nextRunAt?: Date | null;
}

export type ExecutionStatus = 'RUNNING' | 'SUCCESS' | 'FAILED';

export interface JobExecutionLogView {
  id: string;
  tenantId: string;
  ruleId: string | null;
  jobId: string | null;
  status: ExecutionStatus;
  message: string | null;
  metadata: Record<string, unknown> | null;
  startedAt: Date;
  finishedAt: Date | null;
}

export interface ExecutionFilter {
  page?: number;
  limit?: number;
  ruleId?: string;
  jobId?: string;
  status?: ExecutionStatus;
}

export interface TriggerRunResult {
  executionId: string;
  ok: boolean;
  message: string;
}
