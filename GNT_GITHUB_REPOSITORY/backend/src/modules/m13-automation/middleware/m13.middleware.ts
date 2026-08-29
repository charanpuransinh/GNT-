// ============================================================================
// GNT MASTER BLUEPRINT V2 — M13 AUTOMATION — MIDDLEWARE
// Module: M13 | Layer: Middleware
// ============================================================================

import { Request, Response, NextFunction } from "express";

/**
 * TEMP MOCK — Auth middleware placeholder.
 * TODO: Replace with real M06 Auth Module integration.
 * Current: Passes through for development. In production, this MUST
 * validate JWT token, extract tenant/user context, and reject unauthorized.
 */
export function m13AuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  // NOT SPECIFIED: M06 Auth Module integration per roadmap v2.1
  // Placeholder: Attach mock tenant context for development
  (req as any).tenantId = req.headers["x-tenant-id"] || "default-tenant";
  (req as any).userId = req.headers["x-user-id"] || "system";
  next();
}

/**
 * TEMP MOCK — Validation middleware placeholder.
 * TODO: Replace with real M05 Validation Module (Zod/Joi schemas).
 */
export function m13ValidationMiddleware(req: Request, res: Response, next: NextFunction): void {
  // NOT SPECIFIED: M05 Validation schema integration per roadmap v2.1
  // Placeholder: Basic body check
  if (req.method === "POST" || req.method === "PUT") {
    if (!req.body || Object.keys(req.body).length === 0) {
      res.status(400).json({ error: "Request body is required" });
      return;
    }
  }
  next();
}

/**
 * M13-specific error handler.
 * Catches errors from M13 routes and returns structured responses.
 */
export function m13ErrorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  console.error(`[M13] Error: ${err.message}`);
  res.status(500).json({
    error: "M13 Automation Module Error",
    message: err.message,
    module: "M13",
  });
}
