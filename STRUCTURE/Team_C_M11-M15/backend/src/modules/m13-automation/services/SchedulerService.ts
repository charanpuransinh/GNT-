// ⚠️ WIRING AUDIT NOTE (2026-08-28) — यह file M13 के असली/wired entry point (index.ts -> workflow.routes/job.routes/schedule.routes
// -> workflow.controller.ts/job.controller.ts/schedule.controller.ts + scheduler.service.ts + event.handler.ts) से जुड़ी हुई NAHI है।
// यह एक दूसरा, अलग (duplicate) scaffold लगता है जो कभी real path से wire नहीं हुआ, और इसमें broken imports हैं
// (जैसे '../../../m02-auth/src/middleware', '../../../m03-core/src/middleware', '../engine/WorkflowEngine',
// '../scheduler/SchedulerService' — ये paths repo में कहीं मौजूद नहीं हैं)।
// FIX नहीं किया गया — सिर्फ FLAG किया गया, क्योंकि silent delete/rename मना है (Krisna's rule)।
// Krisna से confirm चाहिए: इसे हटाना है, या इसमें जो useful लॉजिक (जैसे WebhookController का HMAC verification) है
// उसे असली wired path में merge करना है।

import { PrismaClient } from '@prisma/client';
import * as cronParser from 'cron-parser';
import { WorkflowEngine } from '../engine/WorkflowEngine';
import { Logger } from '../../../m01-foundation/src/Logger';

export class SchedulerService {
  private prisma: PrismaClient;
  private engine: WorkflowEngine;
  private logger: Logger;
  private isRunning = false;

  constructor(deps: { prisma: PrismaClient; engine: WorkflowEngine }) {
    this.prisma = deps.prisma;
    this.engine = deps.engine;
    this.logger = new Logger('SchedulerService');
  }

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.logger.info('Scheduler service started');

    setInterval(() => this.tick(), 60000);
  }

  async tick() {
    try {
      const now = new Date();
      const dueJobs = await this.prisma.scheduledJob.findMany({
        where: {
          isActive: true,
          nextRunAt: { lte: now }
        }
      });

      for (const job of dueJobs) {
        await this.executeJob(job);
      }
    } catch (error) {
      this.logger.error('Scheduler tick failed', error);
    }
  }

  private async executeJob(job: any) {
    try {
      const interval = cronParser.parseExpression(job.cronExpression, {
        tz: job.timezone,
        currentDate: new Date()
      });
      const nextRunAt = interval.next().toDate();

      await this.prisma.scheduledJob.update({
        where: { id: job.id },
        data: {
          lastRunAt: new Date(),
          lastRunStatus: 'RUNNING',
          nextRunAt
        }
      });

      await this.engine.execute(job.workflowId, {}, {
        tenantId: job.tenantId,
        triggerSource: 'SCHEDULE',
        workflowId: job.workflowId
      });

      await this.prisma.scheduledJob.update({
        where: { id: job.id },
        data: { lastRunStatus: 'SUCCESS' }
      });

    } catch (error) {
      await this.prisma.scheduledJob.update({
        where: { id: job.id },
        data: { lastRunStatus: 'FAILED' }
      });
      this.logger.error(`Scheduled job ${job.id} failed`, error);
    }
  }

  async createScheduledJob(data: {
    workflowId: string;
    name: string;
    cronExpression: string;
    timezone: string;
    tenantId: string;
  }) {
    try {
      const interval = cronParser.parseExpression(data.cronExpression, {
        tz: data.timezone
      });
      const nextRunAt = interval.next().toDate();

      return this.prisma.scheduledJob.create({
        data: {
          ...data,
          nextRunAt
        }
      });
    } catch {
      throw new Error('M13-AUT-007: CRON_EXPRESSION_INVALID');
    }
  }
}
