module: M13-Automation
version: 2.0.0
owner: Team-C
status: production-ready
description: >
  Enterprise workflow automation engine supporting visual workflow design,
  multi-type triggers (webhook, schedule, event, manual), conditional logic,
  and 12+ action types. Includes cron-based scheduler and execution monitoring.
entry_points:
  backend: /modules/m13-automation/src/backend/index.ts
  frontend: /modules/m13-automation/src/frontend/index.tsx
dependencies:
  required: [M01, M02, M03, M04, M05, M06]
  optional: [M07, M08, M09, M10, M11, M12]
public_apis: [WorkflowAPI, TriggerAPI, SchedulerAPI, ExecutionAPI, ActionAPI]
events_published: [workflow.executed, workflow.failed, step.completed, trigger.fired]
events_consumed: [user.created, record.updated, payment.received, invoice.paid]
