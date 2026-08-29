# SESSION 2 — Database Schema + API Contracts
## TEAM C | M11 Payment · M12 HR · M13 Automation · M14 Import/Export · M15 Sync

---

## 📦 Deliverables

### 1. Database Schemas (Prisma)
| File | Module | Tables | Description |
|------|--------|--------|-------------|
| `prisma/M11_Payment.prisma` | M11 Payment | 8 | Payment methods, transactions, schedules, refunds, bank accounts, reconciliations |
| `prisma/M12_HR.prisma` | M12 HR | 10 | Employees, departments, designations, attendance, leaves, payroll, shifts |
| `prisma/M13_Automation.prisma` | M13 Automation | 8 | Workflows, steps, executions, scheduled jobs, automation rules, webhooks |
| `prisma/M14_ImportExport.prisma` | M14 Import/Export | 6 | Import jobs, export jobs, mappings, templates, file uploads |
| `prisma/M15_Sync.prisma` | M15 Sync | 7 | Sync configs, jobs, conflicts, external integrations, sync states |

### 2. API Contracts (TypeScript)
| File | Description |
|------|-------------|
| `contracts/api-contracts.ts` | 50+ interfaces, request/response types, public API definitions, route map |

### 3. Validation Schemas (Zod)
| File | Description |
|------|-------------|
| `validation/zod-schemas.ts` | 30+ Zod schemas with type inference, custom validators, cross-field validation |

### 4. Architecture Documentation
| File | Description |
|------|-------------|
| `SESSION2_WIRING_MAP.md` | Cross-module call matrix, event-driven architecture, data flow diagrams, next sessions preview |

---

## 🔗 Key Design Decisions

1. **No Cross-Module DB Access**: Every module owns its tables. Cross-module calls ONLY via `/api/v1/public/` endpoints.
2. **Event-Driven Async**: Redis/RabbitMQ event bus for loose coupling (invoice.created → payment, leave.applied → workflow).
3. **Decimal as String**: All monetary fields use `Decimal` DB type with string serialization to avoid JS float issues.
4. **Tenant Isolation**: Every table has `tenantId` with composite indexes for multi-tenancy.
5. **Audit Trail**: `createdAt`, `updatedAt`, `createdBy`, `updatedBy` on all transactional tables.
6. **Soft Deletes**: Not used by default; explicit archive status fields (`isActive`, `status`) preferred.
7. **File Storage**: S3-compatible storage with `fileKey` + `fileUrl` pattern across all modules.
8. **JSON Flexibility**: `configJson`, `metadata`, `payload` fields use PostgreSQL JSONB for extensibility.

---

## 📊 Statistics

- **Total Tables**: 39
- **Total API Interfaces**: 50+
- **Total Zod Schemas**: 30+
- **Public API Endpoints**: 25+
- **Event Types Defined**: 8
- **Cross-Module Integration Points**: 40+

---

## 🚀 Next: Session 3 (M11 Payment Backend)

When ready, say: **"Session 3 शुरू करो"**
