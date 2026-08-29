# LOCK_15 — Frontend-Backend Integration Lock

## Status: ✅ LOCKED

- API baseURL: env VITE_API_URL or /api/m14
- Auth: localStorage token + x-tenant-id header
- File upload: multipart/form-data via axios
- File download: axios blob responseType
- Polling: 3s interval for job progress, 5s for lists, 10s for dashboard
- Signed off: Session 10