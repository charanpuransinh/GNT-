/**
 * M28 — scheduler/export-scheduler.ts
 * OWN: Schedule report delivery using the approved scheduler.
 *
 * Rule 27 (Global Rules): M13 remains the canonical scheduler if verified in
 * the repository. M28 must integrate with M13 rather than create a
 * competing cron framework — this file NEVER runs its own cron loop; it
 * only registers a job description with an injected SchedulerPort.
 *
 * VERIFIED, BLOCKED (2026-09-12): M13's real scheduler exists
 * (m13-automation/services/scheduler.service.ts, a real 30s-poll job
 * runner over `scheduled_job`), but M13's PUBLIC index.ts exports only
 * `AutomationService` (rule CRUD + manual trigger) and `schedulerService`
 * (start/stop/runDueJobsOnce) — job creation/update (`createJob`,
 * `updateJob`) lives on `AutomationRepository`, which is NOT exported
 * publicly. Wiring a SchedulerPort here would mean reaching past M13's
 * own public boundary — the same Calling Rule this file itself is
 * written to respect. No SchedulerPort is wired by default; this needs
 * either M13 exposing a public job-creation method, or an owner decision
 * to add one. `ExportScheduler` itself is fully correct and ready — it
 * just has no real adapter to inject yet.
 */

export interface ReportScheduleRequest {
  tenantId: string;
  templateId: string;
  cronExpression: string;
  format: 'PDF' | 'XLSX' | 'CSV';
  recipients: string[];
}

export interface SchedulerPort {
  /** Must be backed by the real, verified M13 scheduler — never a new cron loop. */
  registerJob(jobKey: string, cronExpression: string, payload: Record<string, unknown>): Promise<{ jobId: string }>;
  cancelJob(jobId: string): Promise<void>;
}

export class ExportScheduler {
  constructor(private readonly scheduler: SchedulerPort) {}

  async schedule(request: ReportScheduleRequest): Promise<{ jobId: string }> {
    const jobKey = `m28-report-export:${request.tenantId}:${request.templateId}`;
    return this.scheduler.registerJob(jobKey, request.cronExpression, {
      tenantId: request.tenantId,
      templateId: request.templateId,
      format: request.format,
      recipients: request.recipients,
    });
  }

  async unschedule(jobId: string): Promise<void> {
    await this.scheduler.cancelJob(jobId);
  }
}
