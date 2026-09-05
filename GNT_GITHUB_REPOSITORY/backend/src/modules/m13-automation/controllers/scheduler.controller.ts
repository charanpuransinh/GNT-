// M13 Automation Module - Scheduler Controller (jobs + schedules)

import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/common/errors/error-classes';
import { AutomationRepository } from '../repositories/automation.repository';
import { schedulerService } from '../services/scheduler.service';
import { prisma } from '@/common/config/prisma';
import { nextRunAfter, isValidTimezone, cronMatches } from '../utils/cron';
import type {
  CreateScheduledJobDto,
  UpdateScheduledJobDto,
} from '../types/m13.types';

export class SchedulerController {
  private repo = new AutomationRepository(prisma);

  private tenant(req: Request): string {
    const tenantId = req.tenant?.companyId ?? '';
    if (!tenantId) throw new AppError('FORBIDDEN_NO_TENANT', 'Tenant is required', 403);
    return tenantId;
  }

  listSchedules = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = this.tenant(req);
      const jobs = await this.repo.listJobs(tenantId, {
        ruleId: req.query.ruleId ? String(req.query.ruleId) : undefined,
        status: req.query.status ? String(req.query.status) : undefined,
      });
      res.json({ success: true, data: jobs });
    } catch (err) { next(err); }
  };

  createSchedule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = this.tenant(req);
      const userId = req.user?.id ?? '';
      const dto = req.body as CreateScheduledJobDto;

      // cron सही है और timezone जाना-पहचाना है — पहले जाँचो, फिर रखो
      cronMatches(dto.cronExpr, new Date(), dto.timezone ?? 'UTC');
      if (dto.timezone && !isValidTimezone(dto.timezone)) {
        throw new AppError('BAD_REQUEST', 'अज्ञात timezone', 400);
      }

      // rule उसी company का होना चाहिए (किसी और की company का rule नहीं जोड़ सकते)
      const rule = await this.repo.findRuleById(dto.ruleId, tenantId);
      if (!rule) throw new AppError('NOT_FOUND', 'Automation rule not found', 404);

      const job = await this.repo.createJob(dto, tenantId, userId);
      const next = nextRunAfter(job.cronExpr, new Date(), job.timezone);
      const updated = await this.repo.updateJob(job.id, { nextRunAt: next }, tenantId, userId);
      res.status(201).json({ success: true, data: updated });
    } catch (err) { next(err); }
  };

  updateSchedule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = this.tenant(req);
      const userId = req.user?.id ?? '';
      const dto = req.body as UpdateScheduledJobDto;
      if (dto.cronExpr) {
        cronMatches(dto.cronExpr, new Date(), dto.timezone ?? 'UTC');
      }
      if (dto.timezone && !isValidTimezone(dto.timezone)) {
        throw new AppError('BAD_REQUEST', 'अज्ञात timezone', 400);
      }
      const updated = await this.repo.updateJob(String(req.params.id), dto, tenantId, userId);
      if (dto.cronExpr) {
        const next = nextRunAfter(updated.cronExpr, new Date(), updated.timezone);
        await this.repo.updateJob(updated.id, { nextRunAt: next }, tenantId, userId);
      }
      res.json({ success: true, data: updated });
    } catch (err) { next(err); }
  };

  deleteSchedule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = this.tenant(req);
      await this.repo.deleteJob(String(req.params.id), tenantId);
      res.json({ success: true, data: { deleted: true } });
    } catch (err) { next(err); }
  };

  runScheduleNow = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = this.tenant(req);
      await schedulerService.runJobNow(String(req.params.id), tenantId);
      res.json({ success: true, data: { ran: true, message: 'Job चला दिया गया — हिसाब executions में' } });
    } catch (err) { next(err); }
  };

  listJobExecutions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = this.tenant(req);
      const jobId = String(req.params.id);
      const job = await this.repo.findJobById(jobId, tenantId);
      if (!job) throw new AppError('NOT_FOUND', 'Scheduled job not found', 404);
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
      const { data, total } = await this.repo.listLogs(tenantId, { page, limit, jobId });
      res.json({ success: true, data, meta: { page, limit, total } });
    } catch (err) { next(err); }
  };
}
