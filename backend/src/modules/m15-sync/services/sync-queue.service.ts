// sync-queue.service.ts — partial with safer error handling
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class SyncQueueService {
  async processPendingItems(tenantId: string, batchSize: number = 10): Promise<number> {
    const items = await prisma.syncQueueItem.findMany({ where: { tenantId, status: 'pending' }, take: batchSize, orderBy: { createdAt: 'asc' } });

    let processed = 0;
    for (const item of items) {
      try {
        await prisma.syncQueueItem.update({ where: { id: item.id }, data: { status: 'processing' } });
        await new Promise(resolve => setTimeout(resolve, 100));
        await prisma.syncQueueItem.update({ where: { id: item.id }, data: { status: 'completed', processedAt: new Date() } });
        processed++;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Processing failed';
        await prisma.syncQueueItem.update({ where: { id: item.id }, data: { status: item.retryCount >= item.maxRetries ? 'failed' : 'pending', errorMessage: message, retryCount: { increment: 1 } } });
      }
    }

    return processed;
  }
}
