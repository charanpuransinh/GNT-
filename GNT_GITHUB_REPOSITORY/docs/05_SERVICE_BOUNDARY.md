internal_services:
  - WorkflowDesignService: CRUD + validation for workflow definitions
  - WorkflowEngineService: DAG execution, step routing, error handling
  - TriggerService: Trigger registration, webhook handling, event subscription
  - SchedulerService: Cron parsing, next-run calculation, job dispatch
  - ExecutionService: Execution lifecycle, state management, cancellation
  - ActionRegistryService: Action type definitions, validation schemas
  - AuditLogService: Comprehensive execution logging

external_facing_only:
  - WorkflowController: REST endpoints for workflow management
  - ExecutionController: REST endpoints for execution monitoring
  - WebhookController: Public webhook receiver (idempotency protected)
  - SchedulerController: REST endpoints for scheduled jobs

forbidden_direct_access:
  - No module may query m13_workflow_executions directly
  - No module may query m13_workflow_step_executions directly
  - No module may modify m13_scheduled_jobs directly
  - All execution data access via ExecutionService.getExecutionHistory()
