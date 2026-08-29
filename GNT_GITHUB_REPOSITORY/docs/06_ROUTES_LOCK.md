# LOCK 06: ROUTES LOCK
Mount Point: /api/v1/payments

## Rules
- All routes protected by authMiddleware
- POST/PATCH routes have validateMiddleware(ZodSchema)
- Routes wire controllers ONLY - no inline logic
- Index file aggregates all sub-routers
