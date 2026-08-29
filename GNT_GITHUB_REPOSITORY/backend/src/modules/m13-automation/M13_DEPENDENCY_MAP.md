# M13_DEPENDENCY_MAP.md
# ============================================================================
# GNT MASTER BLUEPRINT V2 — M13 AUTOMATION — DEPENDENCY MAP
# Session: 7 | Module: M13 | Layer: Backend
# ============================================================================

## External Dependencies (package.json)

| Package | Version | Purpose |
|---------|---------|---------|
| bullmq | ^5.x | BullMQ queue engine |
| ioredis | ^5.x | Redis client for BullMQ |
| @prisma/client | ^5.x | Database ORM |
| express | ^4.x | HTTP framework |
| vitest | ^1.x | Test runner |

## Internal Dependencies (within M13)

```
m13.config.ts
    └── (no internal deps)

m13.types.ts
    └── (no internal deps)

DTOs (workflow.dto.ts, trigger.dto.ts, action.dto.ts, job.dto.ts)
    └── (no internal deps)

queue.setup.ts
    ├── m13.config.ts
    └── bullmq, ioredis

queue.names.ts
    └── (no internal deps)

services/workflow-engine.service.ts
    ├── types/m13.types.ts
    ├── queue/queue.setup.ts
    ├── queue/queue.names.ts
    ├── config/m13.config.ts
    └── @prisma/client

services/trigger-evaluator.service.ts
    ├── types/m13.types.ts
    └── @prisma/client

services/action-executor.service.ts
    ├── types/m13.types.ts
    ├── queue/queue.setup.ts
    ├── queue/queue.names.ts
    └── @prisma/client

services/job-processor.service.ts
    ├── types/m13.types.ts
    └── @prisma/client

services/scheduler.service.ts
    ├── queue/queue.setup.ts
    ├── queue/queue.names.ts
    ├── config/m13.config.ts
    └── @prisma/client

services/retry-handler.service.ts
    ├── types/m13.types.ts
    ├── queue/queue.setup.ts
    ├── queue/queue.names.ts
    ├── config/m13.config.ts
    └── @prisma/client

events/event.handler.ts
    ├── types/m13.types.ts
    ├── services/trigger-evaluator.service.ts
    └── services/workflow-engine.service.ts

events/event.emitter.ts
    ├── config/m13.config.ts
    ├── queue/queue.setup.ts
    └── queue/queue.names.ts

controllers/*.ts
    ├── services/*
    └── @prisma/client

routes/*.ts
    ├── controllers/*
    └── middleware/m13.middleware.ts

middleware/m13.middleware.ts
    └── express

utils/m13.utils.ts
    └── (no internal deps)

workers/*.ts
    ├── queue/queue.setup.ts
    ├── queue/queue.names.ts
    └── services/*

index.ts
    ├── routes/*
    ├── services/*
    ├── events/*
    ├── middleware/*
    └── queue/queue.setup.ts
```

## Circular Dependency Check
✅ NO circular dependencies detected
