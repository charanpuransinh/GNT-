# M14 Import/Export — API Contract
## Version: 1.0.0 | Lock: LOCK_02_API

### Base Path: `/api/m14`

---

## Import Endpoints

### POST `/imports/upload`
Upload file and queue import job.
**Body:** multipart/form-data
- `file`: File (csv/xlsx/json)
- `module`: string (e.g., M05)
- `entityType`: string (e.g., product)
- `templateId`: optional string
- `mappingOverride`: optional JSON string
- `dryRun`: optional boolean string

**Response:**
```json
{ "success": true, "jobId": "uuid", "message": "Import job queued" }
```

### POST `/imports/:jobId/validate`
Validate parsed data against schema.
**Response:** `ValidationResult`

### GET `/imports/:jobId`
Get job status & progress.

### GET `/imports`
Query params: `module`, `entityType`, `status`
**Response:** `ImportJob[]`

### POST `/imports/:jobId/cancel`
### POST `/imports/:jobId/retry`

---

## Export Endpoints

### POST `/exports`
**Body:**
```json
{
  "module": "M05",
  "entityType": "product",
  "format": "csv|xlsx|json|pdf",
  "filters": {},
  "columns": ["id", "name"],
  "sort": [{"field":"name","order":"asc"}],
  "templateId": "optional"
}
```
**Response:** `{ "success": true, "jobId": "uuid" }`

### GET `/exports/:jobId`
### GET `/exports`
### POST `/exports/:jobId/cancel`
### GET `/exports/:jobId/download`

---

## Template Endpoints

### POST `/templates`
**Body:**
```json
{
  "name": "Product CSV",
  "module": "M05",
  "entityType": "product",
  "fileType": "csv",
  "columnMapping": [{"sourceColumn":"SKU","targetField":"sku","required":true}],
  "isDefault": false
}
```

### GET `/templates?module=M05&entityType=product`
### GET `/templates/:id`
### PUT `/templates/:id`
### DELETE `/templates/:id`

---

## Job Dashboard

### GET `/jobs/dashboard`
**Response:**
```json
{
  "importStats": { "PENDING": 2, "COMPLETED": 10 },
  "exportStats": { "PROCESSING": 1, "COMPLETED": 5 },
  "recentImports": [...],
  "recentExports": [...]
}
```

### POST `/jobs/cleanup?days=30`
