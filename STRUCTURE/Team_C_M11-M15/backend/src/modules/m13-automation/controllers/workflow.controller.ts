// ============================================================================
// GNT MASTER BLUEPRINT V2 — M13 AUTOMATION MODULE — WORKFLOW CONTROLLER
// Module: M13 | Layer: Controller (API)
// ============================================================================

import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { workflowEngineService } from "../services/workflow-engine.service";
import { triggerEvaluatorService } from "../services/trigger-evaluator.service";

const prisma = new PrismaClient();

export class WorkflowController {
  /**
   * POST /m13/workflows
   * Create a new workflow.
   */
  async createWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, isActive } = req.body;
      const workflow = await prisma.m13Workflow.create({
        data: { name, description, isActive },
      });
      res.status(201).json(workflow);
    } catch (error) {
      res.status(500).json({ error: "Failed to create workflow" });
    }
  }

  /**
   * GET /m13/workflows
   * List all workflows.
   */
  async listWorkflows(req: Request, res: Response): Promise<void> {
    try {
      const workflows = await prisma.m13Workflow.findMany({
        include: { triggers: true, actions: true },
      });
      res.status(200).json(workflows);
    } catch (error) {
      res.status(500).json({ error: "Failed to list workflows" });
    }
  }

  /**
   * GET /m13/workflows/:id
   * Get workflow by ID.
   */
  async getWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const workflow = await prisma.m13Workflow.findUnique({
        where: { id },
        include: { triggers: true, actions: true, jobs: true },
      });
      if (!workflow) {
        res.status(404).json({ error: "Workflow not found" });
        return;
      }
      res.status(200).json(workflow);
    } catch (error) {
      res.status(500).json({ error: "Failed to get workflow" });
    }
  }

  /**
   * PUT /m13/workflows/:id
   * Update workflow.
   */
  async updateWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description, isActive } = req.body;
      const workflow = await prisma.m13Workflow.update({
        where: { id },
        data: { name, description, isActive },
      });
      res.status(200).json(workflow);
    } catch (error) {
      res.status(500).json({ error: "Failed to update workflow" });
    }
  }

  /**
   * DELETE /m13/workflows/:id
   * Delete workflow.
   */
  async deleteWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await prisma.m13Workflow.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete workflow" });
    }
  }

  /**
   * POST /m13/workflows/:id/trigger
   * Manually trigger a workflow.
   */
  async manualTrigger(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const canTrigger = await triggerEvaluatorService.evaluateManualTrigger(id);

      if (!canTrigger) {
        res.status(400).json({ error: "Workflow cannot be triggered manually" });
        return;
      }

      const jobId = await workflowEngineService.triggerWorkflow(id, req.body);
      res.status(202).json({ jobId, message: "Workflow triggered" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Trigger failed";
      res.status(500).json({ error: message });
    }
  }
}

export const workflowController = new WorkflowController();
