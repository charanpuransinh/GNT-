// ============================================================================
// GNT MASTER BLUEPRINT V2 — M13 AUTOMATION MODULE — SCHEDULER SERVICE
// Module: M13 | Layer: Service
// Pattern: Cron-based scheduled job execution
// ============================================================================

import { PrismaClient } from "@prisma/client";
import { M13_QUEUE_NAMES, M13_JOB_NAMES } from "../queue/queue.names";
import { getM13Queue } from "../queue/queue.setup";
import { M13_CONFIG } from "../config/m13.config";

const prisma = new PrismaClient();

export class SchedulerService {
  private intervalId: NodeJS.Timeout | null = null;

  /**
   * PUBLIC API: Create a schedule for a workflow.
   */
  async createSchedule(
    workflowId: string,
    cronExpr: string,
    timezone: string = "UTC"
  ): Promise<string> {
    // NOT SPECIFIED: Cron expression validation library v2.1
    const schedule = await prisma.m13Schedule.create({
      data: {
        workflowId,
        cronExpr,
        timezone,
        isActive: true,
      },
    });

    return schedule.id;
  }

  /**
   * PUBLIC API: Update a schedule.
   */
  async updateSchedule(
    scheduleId: string,
    updates: { cronExpr?: string; timezone?: string; isActive?: boolean }
  ): Promise<void> {
    await prisma.m13Schedule.update({
      where: { id: scheduleId },
      data: updates,
    });
  }

  /**
   * PUBLIC API: Delete a schedule.
   */
  async deleteSchedule(scheduleId: string): Promise<void> {
    await prisma.m13Schedule.delete({
      where: { id: scheduleId },
    });
  }

  /**
   * INTERNAL: Start the scheduler loop.
   * Called by: M13 module initialization.
   */
  startScheduler(): void {
    if (this.intervalId) {
      return;
    }

    this.intervalId = setInterval(async () => {
      await this.checkSchedules();
    }, M13_CONFIG.SCHEDULER_CHECK_INTERVAL_MS);
  }

  /**
   * INTERNAL: Stop the scheduler loop.
   */
  stopScheduler(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * INTERNAL: Check all active schedules and enqueue due jobs.
   */
  private async checkSchedules(): Promise<void> {
    const now = new Date();
    const schedules = await prisma.m13Schedule.findMany({
      where: { isActive: true },
    });

    for (const schedule of schedules) {
      // NOT SPECIFIED: Proper cron-to-next-run calculation v2.1
      // Placeholder: Simple time-based check
      const shouldRun = this.evaluateCron(schedule.cronExpr, now, schedule.timezone);

      if (shouldRun) {
        await this.enqueueScheduledJob(schedule.id, schedule.workflowId);

        await prisma.m13Schedule.update({
          where: { id: schedule.id },
          data: { lastRunAt: now, nextRunAt: this.calculateNextRun(schedule.cronExpr) },
        });
      }
    }
  }

  /**
   * INTERNAL: Enqueue a scheduled workflow job.
   */
  private async enqueueScheduledJob(scheduleId: string, workflowId: string): Promise<void> {
    const queue = getM13Queue(M13_QUEUE_NAMES.SCHEDULED);
    await queue.add(M13_JOB_NAMES.PROCESS_SCHEDULE, {
      scheduleId,
      workflowId,
      triggeredAt: new Date().toISOString(),
    });
  }

  /**
   * NOT SPECIFIED: Cron evaluation logic — placeholder implementation.
   * Will be replaced with proper cron parser in v2.1.
   */
  private evaluateCron(cronExpr: string, now: Date, timezone: string): boolean {
    // Placeholder: Always return true for demo
    // NOT SPECIFIED: Real cron evaluation per roadmap v2.1
    return false;
  }

  /**
   * NOT SPECIFIED: Next run calculation — placeholder implementation.
   */
  private calculateNextRun(cronExpr: string): Date {
    const next = new Date();
    next.setMinutes(next.getMinutes() + 5);
    return next;
  }
}

export const schedulerService = new SchedulerService();
