/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║  M14 IMPORT/EXPORT — QUEUE SERVICE                           ║
 * ║  Lock Artifact #10 — Redis-based Job Queue for Async Ops      ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

import { createClient, RedisClientType } from 'redis';
import { ImportService } from './importService';
import { ExportService } from './exportService';

// ── Redis Client ──
let redisClient: RedisClientType | null = null;

const getRedisClient = async (): Promise<RedisClientType> => {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });
    redisClient.on('error', (err) => console.error('[M14] Redis error:', err));
    await redisClient.connect();
  }
  return redisClient;
};

// ── Queue Names ──
const QUEUES = {
  IMPORT: 'm14:import:queue',
  EXPORT: 'm14:export:queue',
  DEAD_LETTER: 'm14:dead:letter',
} as const;

export class QueueService {
  private importService = new ImportService();
  private exportService = new ExportService();

  // ── ENQUEUE IMPORT ──
  async enqueueImport(tenantId: string, jobId: string): Promise<void> {
    const client = await getRedisClient();
    const job = {
      type: 'import',
      tenantId,
      jobId,
      enqueuedAt: new Date().toISOString(),
      attempts: 0,
      maxAttempts: 3,
    };
    await client.lPush(QUEUES.IMPORT, JSON.stringify(job));
    console.log(`[M14] Import job ${jobId} enqueued for tenant ${tenantId}`);
  }

  // ── ENQUEUE EXPORT ──
  async enqueueExport(tenantId: string, jobId: string): Promise<void> {
    const client = await getRedisClient();
    const job = {
      type: 'export',
      tenantId,
      jobId,
      enqueuedAt: new Date().toISOString(),
      attempts: 0,
      maxAttempts: 3,
    };
    await client.lPush(QUEUES.EXPORT, JSON.stringify(job));
    console.log(`[M14] Export job ${jobId} enqueued for tenant ${tenantId}`);
  }

  // ── CANCEL JOB ──
  async cancelJob(jobId: string): Promise<void> {
    const client = await getRedisClient();
    // Remove from both queues
    for (const queue of [QUEUES.IMPORT, QUEUES.EXPORT]) {
      const jobs = await client.lRange(queue, 0, -1);
      for (const jobStr of jobs) {
        const job = JSON.parse(jobStr);
        if (job.jobId === jobId) {
          await client.lRem(queue, 0, jobStr);
          console.log(`[M14] Job ${jobId} cancelled from ${queue}`);
        }
      }
    }
  }

  // ── PROCESS IMPORT JOB ──
  async processImportJob(jobData: any): Promise<void> {
    const { tenantId, jobId } = jobData;
    console.log(`[M14] Processing import job ${jobId}`);

    try {
      // Update status to processing
      await this.importService.updateImport(tenantId, jobId, { status: 'processing' });

      // Get job details
      const job = await this.importService.getImport(tenantId, jobId);
      if (!job) throw new Error('Job not found');

      // Parse file
      const { parseCSV, parseExcel, parseJSON } = await import('../utils/csvParser');
      const { applyFieldMapping, validateRow } = await import('../utils/fieldMapper');

      let rows: Record<string, any>[] = [];
      switch (job.fileFormat) {
        case 'csv': rows = await parseCSV(job.fileUrl); break;
        case 'excel': rows = await parseExcel(job.fileUrl); break;
        case 'json': rows = await parseJSON(job.fileUrl); break;
      }

      const mapping = (job.mapping || []) as any[];
      const validationRules = (job.validationRules || []) as any[];

      let successCount = 0;
      let failCount = 0;
      let skipCount = 0;
      const errors: any[] = [];

      // Process in batches of 100
      const batchSize = 100;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);

        for (let j = 0; j < batch.length; j++) {
          const rowIndex = i + j + 1;
          const row = batch[j];

          try {
            const mapped = applyFieldMapping(row, mapping);
            const rowErrors = validateRow(mapped, validationRules, rowIndex);

            if (rowErrors.length > 0) {
              errors.push(...rowErrors);
              failCount++;
            } else {
              // In production: write to actual entity table via PUBLIC API
              successCount++;
            }
          } catch (err: any) {
            errors.push({
              rowNumber: rowIndex,
              field: 'general',
              value: null,
              error: err.message,
              severity: 'error',
            });
            failCount++;
          }
        }

        // Update progress
        await this.importService.updateImport(tenantId, jobId, {
          processedRows: i + batch.length,
          successRows: successCount,
          failedRows: failCount,
          skippedRows: skipCount,
          errors: errors as any,
        });
      }

      // Final status
      const finalStatus = failCount === 0 ? 'completed' : successCount > 0 ? 'partial' : 'failed';
      await this.importService.updateImport(tenantId, jobId, {
        status: finalStatus,
        processedRows: rows.length,
        successRows: successCount,
        failedRows: failCount,
        skippedRows: skipCount,
        errors: errors as any,
        completedAt: new Date(),
      });

      console.log(`[M14] Import job ${jobId} completed: ${successCount} success, ${failCount} failed`);
    } catch (err: any) {
      console.error(`[M14] Import job ${jobId} failed:`, err);
      await this.importService.updateImport(tenantId, jobId, {
        status: 'failed',
        errors: [{ rowNumber: 0, field: 'general', value: null, error: err.message, severity: 'error' }] as any,
      });
      throw err;
    }
  }

  // ── PROCESS EXPORT JOB ──
  async processExportJob(jobData: any): Promise<void> {
    const { tenantId, jobId } = jobData;
    console.log(`[M14] Processing export job ${jobId}`);

    try {
      const fileUrl = await this.exportService.generateExportFile(tenantId, jobId);
      console.log(`[M14] Export job ${jobId} completed: ${fileUrl}`);
    } catch (err: any) {
      console.error(`[M14] Export job ${jobId} failed:`, err);
      throw err;
    }
  }

  // ── WORKER LOOP ──
  async startWorker(): Promise<void> {
    console.log('[M14] Queue worker started');
    const client = await getRedisClient();

    while (true) {
      try {
        // Check import queue
        const importJob = await client.brPop(QUEUES.IMPORT, 5);
        if (importJob) {
          const jobData = JSON.parse(importJob.element);
          await this.processImportJob(jobData);
        }

        // Check export queue
        const exportJob = await client.brPop(QUEUES.EXPORT, 5);
        if (exportJob) {
          const jobData = JSON.parse(exportJob.element);
          await this.processExportJob(jobData);
        }
      } catch (err) {
        console.error('[M14] Worker error:', err);
        await new Promise(r => setTimeout(r, 5000));
      }
    }
  }

  // ── GET QUEUE STATS ──
  async getQueueStats(): Promise<{ import: number; export: number; deadLetter: number }> {
    const client = await getRedisClient();
    const [importLen, exportLen, deadLen] = await Promise.all([
      client.lLen(QUEUES.IMPORT),
      client.lLen(QUEUES.EXPORT),
      client.lLen(QUEUES.DEAD_LETTER),
    ]);
    return { import: importLen, export: exportLen, deadLetter: deadLen };
  }
}
