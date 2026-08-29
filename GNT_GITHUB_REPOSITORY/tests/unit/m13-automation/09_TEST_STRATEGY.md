coverage_target: 85%
test_types:
  unit:
    - WorkflowEngineService: DAG traversal, conditional logic, error branches
    - TriggerService: filter matching, webhook validation, event routing
    - SchedulerService: cron parsing, timezone handling, leap year edges
    - ActionRegistryService: action validation, schema enforcement
  integration:
    - Full workflow execution: trigger -> engine -> steps -> completion
    - Webhook trigger -> execution -> notification action
    - Event trigger from M04 bus -> workflow execution
    - Scheduled job -> automatic execution -> audit log
  e2e:
    - Visual workflow builder: create -> save -> execute -> monitor
    - Error handling: failing step -> retry -> fallback -> alert
    - Concurrency: 100 simultaneous executions, no cross-tenant leakage
  performance:
    - Execution throughput: 1000 workflows/minute
    - Scheduler precision: <1s drift for cron jobs
    - Log query: <100ms for 1M log records
