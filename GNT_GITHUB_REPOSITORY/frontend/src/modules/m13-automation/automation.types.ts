/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║  M13 AUTOMATION — TYPES & INTERFACES                         ║
 * ║  Lock Artifact #2 — Domain Types                             ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

export type AutomationStatus = 'active' | 'paused' | 'draft' | 'archived';
export type TriggerType = 'schedule' | 'event' | 'webhook' | 'manual';
export type ActionType = 'email' | 'notification' | 'webhook' | 'update_field' | 'create_record' | 'api_call';
export type ExecutionStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped';

export interface AutomationWorkflow {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  status: AutomationStatus;
  trigger: TriggerConfig;
  actions: ActionConfig[];
  executionCount: number;
  lastExecutedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface TriggerConfig {
  type: TriggerType;
  config: Record<string, any>;
}

export interface ActionConfig {
  id: string;
  type: ActionType;
  name: string;
  config: Record<string, any>;
  delaySeconds?: number;
  condition?: string;
}

export interface ScheduledJob {
  id: string;
  tenantId: string;
  workflowId: string;
  workflowName: string;
  cronExpression: string;
  nextRunAt: string;
  lastRunAt: string | null;
  status: 'scheduled' | 'running' | 'disabled';
  timezone: string;
}

export interface ExecutionLog {
  id: string;
  tenantId: string;
  workflowId: string;
  workflowName: string;
  status: ExecutionStatus;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  triggerData: Record<string, any>;
  actionResults: ActionResult[];
  errorMessage: string | null;
}

export interface ActionResult {
  actionId: string;
  actionName: string;
  status: ExecutionStatus;
  output: Record<string, any>;
  error: string | null;
  durationMs: number;
}

export interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  trigger: TriggerConfig;
  actions: ActionConfig[];
  tags: string[];
}

export interface AutomationRule {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  condition: RuleCondition;
  actions: ActionConfig[];
  priority: number;
  status: AutomationStatus;
}

export interface RuleCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'starts_with' | 'ends_with' | 'in' | 'not_in';
  value: any;
  logic?: 'AND' | 'OR';
  subConditions?: RuleCondition[];
}

export interface AutomationFilters {
  status?: AutomationStatus;
  search?: string;
  triggerType?: TriggerType;
  dateFrom?: string;
  dateTo?: string;
}
