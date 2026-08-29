# M14 Import/Export — Wiring Map
## Lock: LOCK_03_WIRING

### Internal Wiring
```
Routes → Controllers → Services → Prisma → PostgreSQL
                    ↓
               EventBus → Redis Queue → Processors
```

### Cross-Module Calls (PUBLIC API ONLY)
- **ExportProcessor.fetchModuleData()** calls target module's public `/list` endpoint
  - M05 Products → `M05_API_URL/product/list`
  - M06 Parties → `M06_API_URL/customer/list`
  - No direct DB access to other modules

- **Import Completion Events** published to Redis:
  - `import.job.completed` → consumed by target modules for cache invalidation
  - `import.job.failed` → consumed by Monitoring (M19)

### Module Dependencies
- M14 depends on: Redis (queue), PostgreSQL (Prisma), File Storage (S3/MinIO)
- M14 is used by: All modules M05-M13 for bulk operations

### Environment Variables
```
REDIS_URL=redis://localhost:6379
M05_API_URL=http://localhost:3001/api/m05
M06_API_URL=http://localhost:3002/api/m06
...
STORAGE_BUCKET=imports-exports
```

### Event Topics
- `m14:events:import.job.created`
- `m14:events:import.job.completed`
- `m14:events:import.job.failed`
- `m14:events:export.job.created`
- `m14:events:export.job.completed`
- `m14:events:export.job.failed`
