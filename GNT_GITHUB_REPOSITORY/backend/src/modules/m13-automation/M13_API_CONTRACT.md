# M13_API_CONTRACT.md
# ============================================================================
# GNT MASTER BLUEPRINT V2 — M13 AUTOMATION — API CONTRACT
# Session: 7 | Module: M13 | Layer: Backend
# ============================================================================

## Base Path: `/api/m13`

### Workflows

| Method | Path | Auth | Description | Request | Response |
|--------|------|------|-------------|---------|----------|
| POST | /workflows | Required | Create workflow | `{ name, description?, isActive? }` | WorkflowResponseDto |
| GET | /workflows | Required | List workflows | — | WorkflowResponseDto[] |
| GET | /workflows/:id | Required | Get workflow | — | Workflow + triggers + actions + jobs |
| PUT | /workflows/:id | Required | Update workflow | `{ name?, description?, isActive? }` | WorkflowResponseDto |
| DELETE | /workflows/:id | Required | Delete workflow | — | 204 No Content |
| POST | /workflows/:id/trigger | Required | Manual trigger | `{ payload? }` | `{ jobId, message }` |

### Jobs

| Method | Path | Auth | Description | Request | Response |
|--------|------|------|-------------|---------|----------|
| GET | /jobs | Required | List jobs | `?workflowId=&status=` | JobResponseDto[] |
| GET | /jobs/:id | Required | Get job | — | Job + logs |
| POST | /jobs/:id/cancel | Required | Cancel job | — | `{ message }` |
| POST | /jobs/:id/retry | Required | Retry job | — | `{ message }` |

### Schedules

| Method | Path | Auth | Description | Request | Response |
|--------|------|------|-------------|---------|----------|
| POST | /schedules | Required | Create schedule | `{ workflowId, cronExpr, timezone? }` | `{ scheduleId }` |
| GET | /schedules | Required | List schedules | — | Schedule[] |
| PUT | /schedules/:id | Required | Update schedule | `{ cronExpr?, timezone?, isActive? }` | `{ message }` |
| DELETE | /schedules/:id | Required | Delete schedule | — | 204 No Content |

## Event Bus Contract

### M13 Emits (via BullMQ m13:event queue)
- `m13:workflow:triggered` — Workflow manually triggered
- `m13:job:completed` — Job finished successfully
- `m13:job:failed` — Job failed (permanent or retryable)
- `m13:schedule:fired` — Cron schedule triggered

### M13 Listens (via EventHandler)
- Events from M11, M12, M14, M15 matching configured trigger eventName

## NOT SPECIFIED (Roadmap v2.1)
- Rate limiting per endpoint
- Pagination for list endpoints
- Bulk operations
- Webhook callbacks
- GraphQL schema
