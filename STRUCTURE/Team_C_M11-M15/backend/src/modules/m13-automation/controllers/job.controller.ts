// ============================================================================
// GNT MASTER BLUEPRINT V2 — M13 AUTOMATION MODULE — JOB CONTROLLER
// Module: M13 | Layer: Controller (API)
// ============================================================================

import { Request, Response } from "express";
import { jobProcessorService } from "../services/job-processor.service";
import { retryHandlerService } from "../services/retry-handler.service";

export class JobController {
  /**
   * GET /m13/jobs/:id
   * Get job by ID with logs.
   */
  async getJob(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const job = await jobProcessorService.getJob(id);
      if (!job) {
        res.status(404).json({ error: "Job not found" });
        return;
      }
      res.status(200).json(job);
    } catch (error) {
      res.status(500).json({ error: "Failed to get job" });
    }
  }

  /**
   * GET /m13/jobs
   * List jobs for a workflow.
   */
  async listJobs(req: Request, res: Response): Promise<void> {
    try {
      const { workflowId, status } = req.query;
      const jobs = await jobProcessorService.listJobs(
        workflowId as string,
        status as string
      );
      res.status(200).json(jobs);
    } catch (error) {
      res.status(500).json({ error: "Failed to list jobs" });
    }
  }

  /**
   * POST /m13/jobs/:id/cancel
   * Cancel a job.
   */
  async cancelJob(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const cancelled = await jobProcessorService.cancelJob(id);
      if (!cancelled) {
        res.status(400).json({ error: "Job cannot be cancelled" });
        return;
      }
      res.status(200).json({ message: "Job cancelled" });
    } catch (error) {
      res.status(500).json({ error: "Failed to cancel job" });
    }
  }

  /**
   * POST /m13/jobs/:id/retry
   * Retry a failed job.
   */
  async retryJob(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const retried = await retryHandlerService.retryJob(id);
      if (!retried) {
        res.status(400).json({ error: "Job cannot be retried" });
        return;
      }
      res.status(200).json({ message: "Job retry queued" });
    } catch (error) {
      res.status(500).json({ error: "Failed to retry job" });
    }
  }
}

export const jobController = new JobController();
