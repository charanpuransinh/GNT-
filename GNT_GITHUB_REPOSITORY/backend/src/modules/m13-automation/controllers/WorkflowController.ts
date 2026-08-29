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
