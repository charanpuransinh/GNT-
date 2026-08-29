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
import { WorkflowEngine } from '../engine/WorkflowEngine';
import { SchedulerService } from '../scheduler/SchedulerService';

export class WorkflowController {
  constructor(
    private prisma: PrismaClient,
    private engine: WorkflowEngine,
    private scheduler: SchedulerService
  ) {}

  async list(req: Request, res: Response) {
    const { tenantId } = req.user!;
    const { status, page = 1, limit = 20 } = req.query;

    const workflows = await this.prisma.workflow.findMany({
      where: { tenantId, deletedAt: null, ...(status && { status: status as string }) },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { updatedAt: 'desc' }
    });

    res.json({ data: workflows, meta: { page, limit } });
  }

  async create(req: Request, res: Response) {
    const { tenantId, userId } = req.user!;
    const workflow = await this.prisma.workflow.create({
      data: {
        ...req.body,
        tenantId,
        createdBy: userId,
        status: 'DRAFT'
      }
    });
    res.status(201).json(workflow);
  }

  async get(req: Request, res: Response) {
    const { tenantId } = req.user!;
    const { id } = req.params;
    const workflow = await this.prisma.workflow.findFirst({
      where: { id, tenantId, deletedAt: null }
    });
    if (!workflow) return res.status(404).json({ error: 'M13-AUT-001' });
    res.json(workflow);
  }

  async update(req: Request, res: Response) {
    const { tenantId } = req.user!;
    const { id } = req.params;
    const workflow = await this.prisma.workflow.update({
      where: { id },
      data: { ...req.body, tenantId }
    });
    res.json(workflow);
  }

  async delete(req: Request, res: Response) {
    const { id } = req.params;
    await this.prisma.workflow.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
    res.status(204).send();
  }

  async execute(req: Request, res: Response) {
    const { tenantId, userId } = req.user!;
    const { id } = req.params;

    const result = await this.engine.execute(id, req.body, {
      tenantId,
      userId,
      triggerSource: 'MANUAL',
      workflowId: id
    });

    res.json(result);
  }

  async toggle(req: Request, res: Response) {
    const { tenantId } = req.user!;
    const { id } = req.params;

    const workflow = await this.prisma.workflow.findFirst({
      where: { id, tenantId }
    });

    const newStatus = workflow?.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';

    const updated = await this.prisma.workflow.update({
      where: { id },
      data: { status: newStatus }
    });

    res.json(updated);
  }
}
