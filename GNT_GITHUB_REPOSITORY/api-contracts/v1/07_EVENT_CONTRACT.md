events_published:
  - topic: workflow.executed
    payload: { executionId, workflowId, tenantId, status, durationMs }
    consumers: [M19-Monitoring, M03-Audit]
  - topic: workflow.failed
    payload: { executionId, workflowId, tenantId, error, stepId }
    consumers: [M06-Notifications, M19-Monitoring]
  - topic: workflow.trigger.fired
    payload: { triggerId, workflowId, tenantId, triggerType, timestamp }
    consumers: [M19-Monitoring]
  - topic: step.completed
    payload: { executionId, stepId, stepType, durationMs, outputSummary }
    consumers: [M19-Monitoring]

events_consumed:
  - topic: user.created
    handler: checkEventTriggers
    action: evaluate workflow triggers with filter match
  - topic: record.updated
    handler: checkEventTriggers
    action: evaluate workflow triggers with filter match
  - topic: payment.received
    handler: checkEventTriggers
    action: evaluate workflow triggers with filter match
  - topic: invoice.paid
    handler: checkEventTriggers
    action: evaluate workflow triggers with filter match
  - topic: scheduler.tick
    handler: evaluateScheduledJobs
    action: find due jobs and dispatch workflow executions
