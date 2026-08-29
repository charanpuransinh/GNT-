pattern: Modular Monolith Service Layer
execution_model: Event-Driven + Polling Hybrid
concurrency: Worker-queue pattern for workflow execution
scalability: Horizontal via Redis-backed job queues
data_isolation: Strict per-tenant (M01 TenantContext)
cross_module_rule: >
  M13 MAY ONLY interact with other modules via:
  1. M04 EventBus (publish/subscribe)
  2. M03 Public API Gateway
  3. M06 Notification Service (for email/SMS actions)
  4. M05 User Service (for user lookup actions)
engine_design:
  - DAG-based step execution with conditional branching
  - Async step execution with timeout/retry policies
  - Transactional step logging (separate from business tables)
  - Idempotency keys on all trigger endpoints
