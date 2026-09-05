// ============================================================================
// M13 — Automation Repository (Data Access Layer)
// हर query tenant-scoped है — fail-closed: बिना tenantId कुछ नहीं चलता।
// ============================================================================

import { PrismaClient, Prisma } from '@prisma/client';
import { AppError } from '@/common/errors/error-classes';
import type {
  AutomationRuleView,
  CreateAutomationRuleDto,
  UpdateAutomationRuleDto,
  CreateScheduledJobDto,
  UpdateScheduledJobDto,
  ExecutionStatus,
  ExecutionFilter,
} from '../types/m13.types';

type Db = PrismaClient | Prisma.TransactionClient;

function notFound(message: string): AppError {
  return new AppError('NOT_FOUND', message, 404);
}

function ruleToView(r: {
  id: string; tenantId: string; name: string; description: string | null;
  triggerType: string; triggerEvent: string | null; triggerConfig: Prisma.JsonValue | null;
  actions: Prisma.JsonValue; isActive: boolean; createdAt: Date; updatedAt: Date;
  createdBy: string; updatedBy: string;
}): AutomationRuleView {
  return {
    ...r,
    triggerType: r.triggerType as AutomationRuleView['triggerType'],
    triggerConfig: (r.triggerConfig ?? null) as AutomationRuleView['triggerConfig'],
    actions: (r.actions ?? []) as unknown as AutomationRuleView['actions'],
  };
}

export class AutomationRepository {
  constructor(private prisma: Db) {}

  // ───────────────────────────── RULES ─────────────────────────────
  async findRuleById(id: string, tenantId: string): Promise<AutomationRuleView | null> {
    const rule = await this.prisma.automationRule.findFirst({ where: { id, tenantId } });
    return rule ? ruleToView(rule) : null;
  }

  async listRules(tenantId: string, filter: { isActive?: boolean; triggerType?: string } = {}): Promise<AutomationRuleView[]> {
    const rules = await this.prisma.automationRule.findMany({
      where: {
        tenantId,
        ...(filter.isActive !== undefined ? { isActive: filter.isActive } : {}),
        ...(filter.triggerType ? { triggerType: filter.triggerType } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return rules.map(ruleToView);
  }

  async createRule(dto: CreateAutomationRuleDto, tenantId: string, userId: string): Promise<AutomationRuleView> {
    const rule = await this.prisma.automationRule.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description ?? null,
        triggerType: dto.triggerType,
        triggerEvent: dto.triggerEvent ?? null,
        triggerConfig: (dto.triggerConfig ?? null) as Prisma.InputJsonValue,
        actions: dto.actions as unknown as Prisma.InputJsonValue,
        isActive: dto.isActive ?? true,
        createdBy: userId,
        updatedBy: userId,
      },
    });
    return ruleToView(rule);
  }

  async updateRule(id: string, dto: UpdateAutomationRuleDto, tenantId: string, userId: string): Promise<AutomationRuleView> {
    const result = await this.prisma.automationRule.updateMany({
      where: { id, tenantId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.triggerEvent !== undefined ? { triggerEvent: dto.triggerEvent } : {}),
        ...(dto.triggerConfig !== undefined ? { triggerConfig: dto.triggerConfig as Prisma.InputJsonValue } : {}),
        ...(dto.actions !== undefined ? { actions: dto.actions as unknown as Prisma.InputJsonValue } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        updatedBy: userId,
      },
    });
    if (result.count === 0) throw notFound('Automation rule not found');
    const rule = await this.prisma.automationRule.findFirst({ where: { id, tenantId } });
    if (!rule) throw notFound('Automation rule not found');
    return ruleToView(rule);
  }

  async deleteRule(id: string, tenantId: string): Promise<void> {
    const result = await this.prisma.automationRule.deleteMany({ where: { id, tenantId } });
    if (result.count === 0) throw notFound('Automation rule not found');
  }

  /** EVENT-trigger वाले active rules — दिए गए event नाम के लिए */
  async findActiveRulesByEvent(eventName: string, tenantId?: string): Promise<AutomationRuleView[]> {
    const rules = await this.prisma.automationRule.findMany({
      where: {
        isActive: true,
        triggerType: 'EVENT',
        triggerEvent: eventName,
        ...(tenantId ? { tenantId } : {}),
      },
      orderBy: { createdAt: 'asc' },
    });
    return rules.map(ruleToView);
  }

  // ───────────────────────────── JOBS ─────────────────────────────
  async findJobById(id: string, tenantId: string) {
    return this.prisma.scheduledJob.findFirst({ where: { id, tenantId } });
  }

  async listJobs(tenantId: string, filter: { ruleId?: string; status?: string } = {}) {
    return this.prisma.scheduledJob.findMany({
      where: {
        tenantId,
        ...(filter.ruleId ? { ruleId: filter.ruleId } : {}),
        ...(filter.status ? { status: filter.status } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createJob(dto: CreateScheduledJobDto, tenantId: string, userId: string) {
    return this.prisma.scheduledJob.create({
      data: {
        tenantId,
        ruleId: dto.ruleId,
        name: dto.name,
        cronExpr: dto.cronExpr,
        timezone: dto.timezone ?? 'UTC',
        payload: (dto.payload ?? null) as Prisma.InputJsonValue,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  async updateJob(id: string, dto: UpdateScheduledJobDto, tenantId: string, userId: string) {
    const result = await this.prisma.scheduledJob.updateMany({
      where: { id, tenantId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.cronExpr !== undefined ? { cronExpr: dto.cronExpr } : {}),
        ...(dto.timezone !== undefined ? { timezone: dto.timezone } : {}),
        ...(dto.payload !== undefined ? { payload: dto.payload as Prisma.InputJsonValue } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        updatedBy: userId,
      },
    });
    if (result.count === 0) throw notFound('Scheduled job not found');
    const job = await this.prisma.scheduledJob.findFirst({ where: { id, tenantId } });
    if (!job) throw notFound('Scheduled job not found');
    return job;
  }

  async deleteJob(id: string, tenantId: string): Promise<void> {
    const result = await this.prisma.scheduledJob.deleteMany({ where: { id, tenantId } });
    if (result.count === 0) throw notFound('Scheduled job not found');
  }

  /** अभी चलने लायक jobs (सभी tenants के) — scheduler का भीतरी काम */
  async findDueJobs(now: Date) {
    return this.prisma.scheduledJob.findMany({
      where: {
        status: 'ACTIVE',
        OR: [{ nextRunAt: null }, { nextRunAt: { lte: now } }],
      },
      orderBy: { nextRunAt: 'asc' },
    });
  }

  // ───────────────────────────── LOGS ─────────────────────────────
  async createLog(data: {
    tenantId: string;
    ruleId: string | null;
    jobId: string | null;
    status: ExecutionStatus;
    message?: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.prisma.jobExecutionLog.create({
      data: {
        tenantId: data.tenantId,
        ruleId: data.ruleId,
        jobId: data.jobId,
        status: data.status,
        message: data.message ?? null,
        metadata: (data.metadata ?? null) as Prisma.InputJsonValue,
      },
    });
  }

  async finishLog(id: string, tenantId: string, data: { status: ExecutionStatus; message?: string; metadata?: Record<string, unknown> }) {
    const result = await this.prisma.jobExecutionLog.updateMany({
      where: { id, tenantId },
      data: {
        status: data.status,
        message: data.message ?? null,
        metadata: (data.metadata ?? null) as Prisma.InputJsonValue,
        finishedAt: new Date(),
      },
    });
    if (result.count === 0) throw notFound('Execution log not found');
    const log = await this.prisma.jobExecutionLog.findFirst({ where: { id, tenantId } });
    if (!log) throw notFound('Execution log not found');
    return log;
  }

  async listLogs(tenantId: string, filter: ExecutionFilter) {
    const page = filter.page ?? 1;
    const limit = Math.min(filter.limit ?? 20, 100);
    const where = {
      tenantId,
      ...(filter.ruleId ? { ruleId: filter.ruleId } : {}),
      ...(filter.jobId ? { jobId: filter.jobId } : {}),
      ...(filter.status ? { status: filter.status } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.jobExecutionLog.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.jobExecutionLog.count({ where }),
    ]);
    return { data, total, page, limit };
  }
}
