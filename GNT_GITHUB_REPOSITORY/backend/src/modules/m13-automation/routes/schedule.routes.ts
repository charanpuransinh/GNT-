// ============================================================================
// GNT MASTER BLUEPRINT V2 — M13 AUTOMATION — SCHEDULE ROUTES
// Module: M13 | Layer: Routes
// ============================================================================

import { Router } from "express";
import { scheduleController } from "../controllers/schedule.controller";
import { m13AuthMiddleware, m13ValidationMiddleware } from "../middleware/m13.middleware";

const router = Router();

router.post("/", m13AuthMiddleware, m13ValidationMiddleware, scheduleController.createSchedule);
router.get("/", m13AuthMiddleware, scheduleController.listSchedules);
router.put("/:id", m13AuthMiddleware, m13ValidationMiddleware, scheduleController.updateSchedule);
router.delete("/:id", m13AuthMiddleware, scheduleController.deleteSchedule);

export default router;
