// ============================================================================
// GNT MASTER BLUEPRINT V2 — M13 AUTOMATION — WORKFLOW ROUTES
// Module: M13 | Layer: Routes
// ============================================================================

import { Router } from "express";
import { workflowController } from "../controllers/workflow.controller";
import { m13AuthMiddleware, m13ValidationMiddleware } from "../middleware/m13.middleware";

const router = Router();

router.post("/", m13AuthMiddleware, m13ValidationMiddleware, workflowController.createWorkflow);
router.get("/", m13AuthMiddleware, workflowController.listWorkflows);
router.get("/:id", m13AuthMiddleware, workflowController.getWorkflow);
router.put("/:id", m13AuthMiddleware, m13ValidationMiddleware, workflowController.updateWorkflow);
router.delete("/:id", m13AuthMiddleware, workflowController.deleteWorkflow);
router.post("/:id/trigger", m13AuthMiddleware, workflowController.manualTrigger);

export default router;
