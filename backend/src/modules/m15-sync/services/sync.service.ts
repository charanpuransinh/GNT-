// sync.service.ts (partial) — only modified error handling sections
import { prisma } from '../../common/config/prisma';

export class SyncService {
  // ... other methods ...

  private static async someJobHandler(jobId: string, config: any, startTime: number) {
    try {
      // job processing logic
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Job failed';
      const stack = error instanceof Error ? error.stack : undefined;

      await prisma.syncJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          durationMs: Date.now() - startTime,
          errorSummary: { message, stack }
        }
      });

      await prisma.syncConfig.update({
        where: { id: config.id },
        data: {
          lastSyncStatus: 'FAILED',
          consecutiveErrors: { increment: 1 },
          status: config.consecutiveErrors + 1 >= config.errorThreshold ? 'ERROR' : config.status
        }
      });
    }
  }
}
