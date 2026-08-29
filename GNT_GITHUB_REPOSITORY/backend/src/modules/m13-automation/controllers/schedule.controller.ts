// ============================================================================
// GNT MASTER BLUEPRINT V2 — M13 AUTOMATION MODULE — SCHEDULE CONTROLLER
// Module: M13 | Layer: Controller (API)
// ============================================================================

import { Request, Response } from "express";
import { schedulerService } from "../services/scheduler.service";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class ScheduleController {
  /**
   * POST /m13/schedules
   * Create a schedule.
   */
  async createSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { workflowId, cronExpr, timezone } = req.body;
      const scheduleId = await schedulerService.createSchedule(
        workflowId,
        cronExpr,
        timezone
      );
      res.status(201).json({ scheduleId });
    } catch (error) {
      res.status(500).json({ error: "Failed to create schedule" });
    }
  }

  /**
   * GET /m13/schedules
   * List schedules.
   */
  async listSchedules(req: Request, res: Response): Promise<void> {
    try {
      const schedules = await prisma.m13Schedule.findMany();
      res.status(200).json(schedules);
    } catch (error) {
      res.status(500).json({ error: "Failed to list schedules" });
    }
  }

  /**
   * PUT /m13/schedules/:id
   * Update schedule.
   */
  async updateSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { cronExpr, timezone, isActive } = req.body;
      await schedulerService.updateSchedule(id, { cronExpr, timezone, isActive });
      res.status(200).json({ message: "Schedule updated" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update schedule" });
    }
  }

  /**
   * DELETE /m13/schedules/:id
   * Delete schedule.
   */
  async deleteSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await schedulerService.deleteSchedule(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete schedule" });
    }
  }
}

export const scheduleController = new ScheduleController();
