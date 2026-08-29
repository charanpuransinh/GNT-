# LOCK_02 — API Layer Lock

## Status: ✅ LOCKED

- Axios instance with baseURL from env VITE_API_URL
- Interceptor injects x-tenant-id + Authorization Bearer token
- importApi: upload (multipart), validate, getJob, listJobs, cancel, retry
- exportApi: create, getJob, listJobs, cancel, download (blob)
- templateApi: CRUD operations
- dashboardApi: getStats, cleanup
- Signed off: Session 10