// ============================================================================
// M13 — Automation Service (PUBLIC API)
// blueprint §7.13: Automation rules CRUD + manual trigger + execution log
// ============================================================================

import { PrismaClient } from '@prisma/client';
import { AppError } from '@/common/errors/error-classes';
import { AutomationRepository } from '../repositories/automation.repository';
import { executeRuleActions } from './automation.internal';
import type {
  CreateAutomationRuleDto,
  UpdateAutomationRuleDto,
  ExecutionFilter,
  TriggerRunResult,
} from '../types/m13.types';

export class AutomationService {
  private repo: AutomationRepository;

  constructor(private prisma: PrismaClient) {
    this.repo = new AutomationRepository(prisma);
  }

  // ───────────────────────────── RULES ─────────────────────────────
  async listRules(tenantId: string, query: { isActive?: string; triggerType?: string }) {
    if (!tenantId) throw new AppError('FORBIDDEN_NO_TENANT', 'Tenant is required', 403);
    return this.repo.listRules(tenantId, {
      isActive: query.isActive === undefined ? undefined : query.isActive === 'true',
      triggerType: query.triggerType,
    });
  }

  async getRule(id: string, tenantId: string) {
    const rule = await this.repo.findRuleById(id, tenantId);
    if (!rule) throw new AppError('NOT_FOUND', 'Automation rule not found', 404);
    return rule;
  }

  async createRule(dto: CreateAutomationRuleDto, tenantId: string, userId: string) {
    if (!tenantId) throw new AppError('FORBIDDEN_NO_TENANT', 'Tenant is required', 403);
    if (dto.triggerType === 'EVENT' && !dto.triggerEvent) {
      throw new AppError('BAD_REQUEST', 'EVENT trigger के लिए triggerEvent ज़रूरी है', 400);
    }
    return this.repo.createRule(dto, tenantId, userId);
  }

  async updateRule(id: string, dto: UpdateAutomationRuleDto, tenantId: string, userId: string) {
    return this.repo.updateRule(id, dto, tenantId, userId);
  }

  async deleteRule(id: string, tenantId: string) {
    return this.repo.deleteRule(id, tenantId);
  }

  // ───────────────────────────── TRIGGER ─────────────────────────────
  /** हाथ से rule चलाना — नतीजा execution log में दर्ज होता है */
  async triggerRule(id: string, tenantId: string, userId: string, payload: Record<string, unknown>): Promise<TriggerRunResult> {
    const rule = await this.repo.findRuleById(id, tenantId);
    if (!rule) throw new AppError('NOT_FOUND', 'Automation rule not found', 404);
    if (!rule.isActive) throw new AppError('BAD_REQUEST', 'Rule निष्क्रिय है — पहले चालू करें', 400);

    const log = await this.repo.createLog({
      tenantId,
      ruleId: rule.id,
      jobId: null,
      status: 'RUNNING',
    });
    const result = await executeRuleActions(rule, tenantId, {
      ...payload,
      triggeredBy: userId,
      triggeredAt: new Date().toISOString(),
    });
    const finished = await this.repo.finishLog(log.id, tenantId, {
      status: result.ok ? 'SUCCESS' : 'FAILED',
      message: result.message,
      metadata: { steps: result.steps },
    });
    return {
      executionId: finished.id,
      ok: result.ok,
      message: result.message,
    };
  }

  // ───────────────────────────── EXECUTIONS ─────────────────────────────
  async listExecutions(tenantId: string, filter: ExecutionFilter) {
    return this.repo.listLogs(tenantId, filter);
  }
}
