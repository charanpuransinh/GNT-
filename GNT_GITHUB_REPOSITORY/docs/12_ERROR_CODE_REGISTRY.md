M13-AUT-001:
  code: WORKFLOW_NOT_FOUND
  message: Workflow definition not found
  http: 404
  retryable: false

M13-AUT-002:
  code: INVALID_WORKFLOW_STATUS
  message: Workflow must be ACTIVE to execute
  http: 409
  retryable: false

M13-AUT-003:
  code: TRIGGER_CONFIG_INVALID
  message: Trigger configuration failed validation
  http: 400
  retryable: false

M13-AUT-004:
  code: STEP_EXECUTION_FAILED
  message: Workflow step failed after max retries
  http: 500
  retryable: true

M13-AUT-005:
  code: EXECUTION_TIMEOUT
  message: Workflow execution exceeded time limit
  http: 504
  retryable: true

M13-AUT-006:
  code: WEBHOOK_SIGNATURE_INVALID
  message: Webhook HMAC signature verification failed
  http: 401
  retryable: false

M13-AUT-007:
  code: CRON_EXPRESSION_INVALID
  message: Invalid cron expression format
  http: 400
  retryable: false

M13-AUT-008:
  code: ACTION_TYPE_UNKNOWN
  message: Requested action type is not registered
  http: 400
  retryable: false

M13-AUT-009:
  code: EXECUTION_CANCELLED
  message: Execution was cancelled by user or system
  http: 409
  retryable: false

M13-AUT-010:
  code: TENANT_ISOLATION_VIOLATION
  message: Cross-tenant workflow access detected
  http: 403
  retryable: false
