// ============================================================================
// M13 — Scheduler Service (job runner)
//
// blueprint §7.13: scheduled_job = "Job definitions + schedules"।
// बाहरी queue-library नहीं — हर 30 सेकंड में due jobs चलते हैं (unref'd timer)।
// हर run का पूरा हिसाब job_execution_log में जाता है (audit trail)।
// ============================================================================

import { prisma } from '@/common/config/prisma';
import { AutomationRepository } from '../repositories/automation.repository';
import { executeRuleActions } from './automation.internal';
import { nextRunAfter } from '../utils/cron';
import { AppError } from '@/common/errors/error-classes';

const POLL_INTERVAL_MS = 30_000;

class SchedulerService {
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  /** Module चढ़ते ही चालू — timer unref'd है, process को नहीं रोकेगा */
  startScheduler(): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      this.runDueJobsOnce().catch((error) => {
        console.error('[M13] scheduler loop गिरा:', error);
      });
    }, POLL_INTERVAL_MS);
    this.timer.unref();
  }

  stopScheduler(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** अभी due सारे jobs चलाना (tests भी यही बुलाते हैं — deterministic) */
  async runDueJobsOnce(now: Date = new Date()): Promise<number> {
    if (this.running) return 0;
    this.running = true;
    try {
      const repo = new AutomationRepository(prisma);
      const jobs = await repo.findDueJobs(now);
      let ran = 0;
      for (const job of jobs) {
        try {
          await this.runJob(job, repo, now);
          ran++;
        } catch (error) {
          // एक job का गिरना दूसरों को नहीं रोकेगा — पर छिपेगा भी नहीं
          console.error(`[M13] job ${job.id} गिरा:`, error);
        }
      }
      return ran;
    } finally {
      this.running = false;
    }
  }

  /** tests / admin के लिए: एक ख़ास job को अभी चलाना (tenant की बंदिश साथ) */
  async runJobNow(jobId: string, tenantId: string): Promise<void> {
    const repo = new AutomationRepository(prisma);
    const job = await repo.findJobById(jobId, tenantId);
    if (!job) throw new AppError('NOT_FOUND', 'Scheduled job not found', 404);
    await this.runJob(job, repo, new Date());
  }

  private async runJob(
    job: {
      id: string;
      tenantId: string;
      ruleId: string;
      name: string;
      cronExpr: string;
      timezone: string;
      payload: unknown;
    },
    repo: AutomationRepository,
    now: Date,
  ): Promise<void> {
    // rule मौजूद और चालू हो — वरना job रोक दो (fail-closed, ख़ामोश नहीं)
    const rule = await repo.findRuleById(job.ruleId, job.tenantId);
    if (!rule || !rule.isActive) {
      await repo.updateJob(job.id, { status: 'PAUSED' }, job.tenantId, 'system');
      await repo.createLog({
        tenantId: job.tenantId,
        ruleId: job.ruleId,
        jobId: job.id,
        status: 'FAILED',
        message: 'Rule मौजूद नहीं या निष्क्रिय है — job रोक दिया गया',
      });
      return;
    }

    const payload = {
      ...((job.payload as Record<string, unknown> | null) ?? {}),
      jobName: job.name,
      scheduledAt: now.toISOString(),
    };

    const log = await repo.createLog({
      tenantId: job.tenantId,
      ruleId: rule.id,
      jobId: job.id,
      status: 'RUNNING',
    });
    const result = await executeRuleActions(rule, job.tenantId, payload);
    await repo.finishLog(log.id, job.tenantId, {
      status: result.ok ? 'SUCCESS' : 'FAILED',
      message: result.message,
      metadata: { steps: result.steps },
    });

    await repo.updateJob(job.id, {
      lastRunAt: now,
      nextRunAt: nextRunAfter(job.cronExpr, now, job.timezone),
    }, job.tenantId, 'system');
  }
}

export const schedulerService = new SchedulerService();
