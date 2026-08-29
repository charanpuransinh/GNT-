services:
  - api: Standard Node.js Express (M01 pattern)
  - worker: Dedicated worker process for workflow execution
  - scheduler: Dedicated cron daemon (node-cron + bullmq)

infrastructure:
  - Redis: Required for job queues and distributed locks
  - PostgreSQL: Primary datastore (M01 cluster)
  - BullMQ: Job queue for async execution

scaling:
  - API: Horizontal (stateless)
  - Worker: Horizontal (Redis-backed, idempotent)
  - Scheduler: Single instance with leader election (Redis Redlock)

health_checks:
  - /health: API responsiveness
  - /health/worker: Queue depth < 1000
  - /health/scheduler: Next job scheduled within 5 minutes

environment_variables:
  - REDIS_URL: Redis connection string
  - WORKER_CONCURRENCY: 5 (default)
  - MAX_EXECUTION_TIME_MS: 300000 (5 minutes)
  - WEBHOOK_SECRET_PREFIX: whsec_
  - SCHEDULER_ENABLED: true/false
