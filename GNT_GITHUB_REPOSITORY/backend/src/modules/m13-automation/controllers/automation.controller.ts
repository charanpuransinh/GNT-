// M13 Automation Module - Automation Rules Controller
// (tenant/user पहचान सिर्फ़ verified token से — req.tenant / req.user, header नहीं)

import { Request, Response, NextFunction } from 'express';
import { AutomationService } from '../services/automation.service';
import type {
  CreateAutomationRuleDto,
  UpdateAutomationRuleDto,
} from '../types/m13.types';

export class AutomationController {
  constructor(private service: AutomationService) {}

  listRules = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenant?.companyId ?? '';
      const rules = await this.service.listRules(tenantId, {
        isActive: req.query.isActive ? String(req.query.isActive) : undefined,
        triggerType: req.query.triggerType ? String(req.query.triggerType) : undefined,
      });
      res.json({ success: true, data: rules });
    } catch (err) { next(err); }
  };

  getRule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenant?.companyId ?? '';
      const rule = await this.service.getRule(String(req.params.id), tenantId);
      res.json({ success: true, data: rule });
    } catch (err) { next(err); }
  };

  createRule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenant?.companyId ?? '';
      const userId = req.user?.id ?? '';
      const rule = await this.service.createRule(req.body as CreateAutomationRuleDto, tenantId, userId);
      res.status(201).json({ success: true, data: rule });
    } catch (err) { next(err); }
  };

  updateRule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenant?.companyId ?? '';
      const userId = req.user?.id ?? '';
      const rule = await this.service.updateRule(
        String(req.params.id),
        req.body as UpdateAutomationRuleDto,
        tenantId,
        userId,
      );
      res.json({ success: true, data: rule });
    } catch (err) { next(err); }
  };

  deleteRule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenant?.companyId ?? '';
      await this.service.deleteRule(String(req.params.id), tenantId);
      res.json({ success: true, data: { deleted: true } });
    } catch (err) { next(err); }
  };

  triggerRule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenant?.companyId ?? '';
      const userId = req.user?.id ?? '';
      const payload = (req.body?.payload ?? {}) as Record<string, unknown>;
      const result = await this.service.triggerRule(String(req.params.id), tenantId, userId, payload);
      res.json({ success: result.ok, data: result, message: result.message });
    } catch (err) { next(err); }
  };

  listExecutions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenant?.companyId ?? '';
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
      const { data, total } = await this.service.listExecutions(tenantId, {
        page,
        limit,
        ruleId: req.query.ruleId ? String(req.query.ruleId) : undefined,
        jobId: req.query.jobId ? String(req.query.jobId) : undefined,
        status: req.query.status ? String(req.query.status) as 'RUNNING' | 'SUCCESS' | 'FAILED' : undefined,
      });
      res.json({ success: true, data, meta: { page, limit, total } });
    } catch (err) { next(err); }
  };
}
