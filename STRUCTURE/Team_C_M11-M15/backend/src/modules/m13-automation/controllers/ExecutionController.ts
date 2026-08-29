// ⚠️ WIRING AUDIT NOTE (2026-08-28) — यह file M13 के असली/wired entry point (index.ts -> workflow.routes/job.routes/schedule.routes
// -> workflow.controller.ts/job.controller.ts/schedule.controller.ts + scheduler.service.ts + event.handler.ts) से जुड़ी हुई NAHI है।
// यह एक दूसरा, अलग (duplicate) scaffold लगता है जो कभी real path से wire नहीं हुआ, और इसमें broken imports हैं
// (जैसे '../../../m02-auth/src/middleware', '../../../m03-core/src/middleware', '../engine/WorkflowEngine',
// '../scheduler/SchedulerService' — ये paths repo में कहीं मौजूद नहीं हैं)।
// FIX नहीं किया गया — सिर्फ FLAG किया गया, क्योंकि silent delete/rename मना है (Krisna's rule)।
// Krisna से confirm चाहिए: इसे हटाना है, या इसमें जो useful लॉजिक (जैसे WebhookController का HMAC verification) है
// उसे असली wired path में merge करना है।

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

export class ExecutionController {
  constructor(private prisma: PrismaClient) {}

  async list(req: Request, res: Response) {
    const { tenantId } = req.user!;
    const { workflowId, status, page = 1, limit = 20 } = req.query;

    const executions = await this.prisma.workflowExecution.findMany({
      where: { 
        tenantId, 
        ...(workflowId && { workflowId: workflowId as string }),
        ...(status && { status: status as string })
      },
      include: { steps: true },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { startedAt: 'desc' }
    });

    res.json({ data: executions, meta: { page, limit } });
  }

  async get(req: Request, res: Response) {
    const { tenantId } = req.user!;
    const { id } = req.params;

    const execution = await this.prisma.workflowExecution.findFirst({
      where: { id, tenantId },
      include: { steps: true, logs: true }
    });

    if (!execution) return res.status(404).json({ error: 'Execution not found' });
    res.json(execution);
  }

  async cancel(req: Request, res: Response) {
    const { tenantId } = req.user!;
    const { id } = req.params;

    const execution = await this.prisma.workflowExecution.updateMany({
      where: { id, tenantId, status: 'RUNNING' },
      data: { status: 'CANCELLED', completedAt: new Date() }
    });

    res.json({ cancelled: execution.count > 0 });
  }

  async listJobs(req: Request, res: Response) {
    const { tenantId } = req.user!;
    const jobs = await this.prisma.scheduledJob.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ data: jobs });
  }

  async createJob(req: Request, res: Response) {
    const { tenantId } = req.user!;
    const scheduler = req.app.get('schedulerService');
    const job = await scheduler.createScheduledJob({ ...req.body, tenantId });
    res.status(201).json(job);
  }

  async deleteJob(req: Request, res: Response) {
    const { tenantId } = req.user!;
    const { id } = req.params;
    await this.prisma.scheduledJob.deleteMany({
      where: { id, tenantId }
    });
    res.status(204).send();
  }
}
