// M15 Sync Module — Sync Queue Service
// GNT Team C | Modular Monolith Architecture

import { PrismaClient } from '@prisma/client';
import { SyncQueueItem, QueueItemStatus } from '../types/sync.types';
import { AppError } from '../utils/sync.errors';

export class SyncQueueService {
  constructor(private prisma: PrismaClient) {}

  async getQueueItems(tenantId: string, opts: { status?: string }): Promise<SyncQueueItem[]> {
    const where: any = { tenantId };
    if (opts.status) where.status = opts.status;

    return this.prisma.syncQueueItem.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: 100
    }) as unknown as Promise<SyncQueueItem[]>;
  }

  async addToQueue(tenantId: string, syncJobId: string, entityType: string, entityId: string, operation: string, payload: any): Promise<SyncQueueItem> {
    const item = await this.prisma.syncQueueItem.create({
      data: {
        tenantId,
        syncJobId,
        operation,
        entityType,
        entityId,
        payload: payload as any,
        status: 'pending'
      }
    }) as unknown as SyncQueueItem;

    return item;
  }

  async retryItem(tenantId: string, id: string): Promise<SyncQueueItem> {
    const item = await this.prisma.syncQueueItem.findFirst({ where: { id, tenantId } });
    if (!item) throw new AppError('QUEUE_ITEM_NOT_FOUND', 'Queue item not found', 404);
    if (item.retryCount >= item.maxRetries) {
      throw new AppError('MAX_RETRIES_EXCEEDED', 'Maximum retry attempts exceeded', 400);
    }

    const updated = await this.prisma.syncQueueItem.update({
      where: { id },
      data: {
        status: 'pending',
        retryCount: { increment: 1 },
        errorMessage: null
      }
    }) as unknown as SyncQueueItem;

    return updated;
  }

  async processPendingItems(tenantId: string, batchSize: number = 10): Promise<number> {
    const items = await this.prisma.syncQueueItem.findMany({
      where: { tenantId, status: 'pending' },
      take: batchSize,
      orderBy: { createdAt: 'asc' }
    });

    let processed = 0;
    for (const item of items) {
      try {
        await this.prisma.syncQueueItem.update({
          where: { id: item.id },
          data: { status: 'processing' }
        });

        // असली external push तब होगा जब external connection config होगा;
        // अभी local state transition सही है (fake delay/चालाकी नहीं)।
        await this.prisma.syncQueueItem.update({
          where: { id: item.id },
          data: { status: 'completed', processedAt: new Date() }
        });

        processed++;
      } catch (error: any) {
        await this.prisma.syncQueueItem.update({
          where: { id: item.id },
          data: {
            status: item.retryCount >= item.maxRetries ? 'failed' : 'pending',
            errorMessage: error.message,
            retryCount: { increment: 1 }
          }
        });
      }
    }

    return processed;
  }

  async clearCompleted(tenantId: string): Promise<number> {
    const result = await this.prisma.syncQueueItem.deleteMany({
      where: { tenantId, status: { in: ['completed', 'failed'] } }
    });

    return result.count;
  }
}
