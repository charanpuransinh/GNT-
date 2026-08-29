# M14 Import/Export — Database Schema
## Lock: LOCK_01_SCHEMA

### Tables

#### `m14_import_jobs`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| tenantId | String | Indexed |
| module | String | Target module code |
| entityType | String | e.g. product, customer |
| fileUrl | String | Storage path |
| fileType | String | csv/xlsx/json |
| status | Enum | PENDING/VALIDATING/PROCESSING/COMPLETED/FAILED/CANCELLED |
| mappingConfig | JSON | Field mappings |
| totalRows | Int | 0 default |
| processedRows | Int | 0 default |
| successRows | Int | 0 default |
| failedRows | Int | 0 default |
| errorLog | JSON | Array of errors |
| createdBy | String | FK to user |
| createdAt | DateTime | now() |
| updatedAt | DateTime | updatedAt |
| completedAt | DateTime? | |

#### `m14_export_jobs`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| tenantId | String | Indexed |
| module | String | |
| entityType | String | |
| format | Enum | CSV/XLSX/JSON/PDF |
| filters | JSON | Query filters |
| sortConfig | JSON | |
| columnConfig | JSON | Selected columns |
| fileUrl | String? | Output path |
| status | Enum | PENDING/PROCESSING/COMPLETED/FAILED/CANCELLED |
| totalRows | Int | |
| createdBy | String | |
| createdAt | DateTime | |
| updatedAt | DateTime | |
| completedAt | DateTime? | |

#### `m14_import_templates`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| tenantId | String | |
| name | String | Unique per tenant |
| module | String | |
| entityType | String | |
| fileType | String | |
| columnMapping | JSON | Array of mappings |
| sampleFileUrl | String? | |
| isDefault | Boolean | false |
| createdBy | String | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

#### `m14_export_templates`
Same structure as import_templates but for export configs.

### Indexes
- `(tenantId, status)` on both job tables
- `(tenantId, entityType, createdAt)` for recent queries
- `(tenantId, module, entityType)` on templates
