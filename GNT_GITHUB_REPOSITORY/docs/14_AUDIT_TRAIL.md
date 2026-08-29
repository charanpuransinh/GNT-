audited_entities:
  - Workflow: create, update, delete, status_change
  - WorkflowTrigger: create, update, delete, activate, deactivate
  - WorkflowExecution: start, complete, fail, cancel
  - ScheduledJob: create, update, delete, run, miss

audit_fields:
  - actor: userId or SYSTEM
  - action: CRUD + EXECUTE + CANCEL + TOGGLE
  - entityType: workflow | trigger | execution | schedule
  - entityId: UUID
  - beforeState: JSON snapshot
  - afterState: JSON snapshot
  - tenantId: Scoped
  - ipAddress: From request
  - userAgent: From request
  - timestamp: ISO8601

retention:
  - execution_logs: 90 days
  - audit_records: 7 years
  - archived_workflows: indefinite
