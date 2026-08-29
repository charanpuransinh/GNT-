// ============================================================================
// GNT MASTER BLUEPRINT V2 — M13 AUTOMATION — JOB ROUTES
// Module: M13 | Layer: Routes
// ============================================================================

import { Router } from "express";
import { jobController } from "../controllers/job.controller";
import { m13AuthMiddleware } from "../middleware/m13.middleware";

const router = Router();

router.get("/", m13AuthMiddleware, jobController.listJobs);
router.get("/:id", m13AuthMiddleware, jobController.getJob);
router.post("/:id/cancel", m13AuthMiddleware, jobController.cancelJob);
router.post("/:id/retry", m13AuthMiddleware, jobController.retryJob);

export default router;
