# M13_WIRING_MAP.md
# ============================================================================
# GNT MASTER BLUEPRINT V2 — M13 AUTOMATION — WIRING & CALL MAP
# Session: 7 | Module: M13 | Layer: Backend
# ============================================================================

## INBOUND (Other Modules → M13)

| Source Module | Interface Type | Entry Point | Purpose |
|--------------|----------------|-------------|---------|
| M04 Config   | IMPORT         | m13.config.ts | Redis connection config |
| M05 Validation | IMPORT       | m13.middleware.ts | Request validation (TEMP MOCK) |
| M06 Auth     | IMPORT         | m13.middleware.ts | Auth middleware (TEMP MOCK) |
| M08 Notification | SERVICE CALL | action-executor.service.ts | SEND_EMAIL action delegate |
| M11 Payment  | EVENT          | event.handler.ts | Payment events → workflow triggers |
| M12 HR       | EVENT          | event.handler.ts | HR events → workflow triggers |
| M14 Import/Export | EVENT     | event.handler.ts | Import/Export events → workflow triggers |
| M15 Sync     | EVENT          | event.handler.ts | Sync events → workflow triggers |
| M18 Integration | EVENT BUS   | event.handler.ts | Central event bus subscription |
| M19 Monitoring | SERVICE CALL | job-processor.service.ts | Job metrics export |

## OUTBOUND (M13 → Other Modules)

| Target Module | Interface Type | Exit Point | Purpose |
|--------------|----------------|------------|---------|
| M08 Notification | PUBLIC API | action-executor.service.ts | SEND_EMAIL delegate |
| M18 Integration | EVENT BUS | event.emitter.ts | Emit M13 events via BullMQ queue |
| M19 Monitoring | LOG STREAM | All workers | Job execution logs |

## INTERNAL WIRING

| Layer | File | Calls |
|-------|------|-------|
| Controller | workflow.controller.ts | workflowEngineService, triggerEvaluatorService |
| Controller | job.controller.ts | jobProcessorService, retryHandlerService |
| Controller | schedule.controller.ts | schedulerService |
| Service | workflow-engine.service.ts | Queue (m13:workflow), Prisma (m13_job) |
| Service | trigger-evaluator.service.ts | Prisma (m13_trigger) |
| Service | action-executor.service.ts | Prisma (m13_job_log), M08 API (NOT SPECIFIED) |
| Service | job-processor.service.ts | Prisma (m13_job, m13_job_log) |
| Service | scheduler.service.ts | Queue (m13:scheduled), Prisma (m13_schedule) |
| Service | retry-handler.service.ts | Queue (m13:retry), Prisma (m13_job) |
| Worker | workflow.worker.ts | workflowEngineService, actionExecutorService, jobProcessorService, retryHandlerService |
| Worker | scheduled.worker.ts | triggerEvaluatorService, workflowEngineService |
| Worker | retry.worker.ts | workflowEngineService, jobProcessorService |
| Event | event.handler.ts | triggerEvaluatorService, workflowEngineService |
| Event | event.emitter.ts | BullMQ Queue (m13:event) |

## CROSS-MODULE RULES VERIFIED
✅ NO direct DB access to other modules
✅ NO direct repo imports from other modules
✅ All cross-module calls via PUBLIC Service/API/Event ONLY
✅ Event bus uses real Redis-backed BullMQ (NOT in-memory)
