// ============================================================
// M15 Sync Module — Event Definitions & Publishers
// Lock Artifact: M15-L04
// Event Bus: Redis Queue (BullMQ) — must use real Redis
// ============================================================

import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null
});

const eventQueue = new Queue('gnt-events', { connection: redis });

export interface SyncEvent {
  eventType: string;
  module: 'M15';
  tenantId: string;
  payload: Record<string, unknown>;
  timestamp: string;
  correlationId?: string;
}

export class SyncEventPublisher {
  static async publish(event: SyncEvent): Promise<void> {
    await eventQueue.add(event.eventType, event, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 }
    });
  }

  static async syncStarted(jobId: string, tenantId: string, configCode: string): Promise<void> {
    await this.publish({
      eventType: 'SYNC_STARTED',
      module: 'M15',
      tenantId,
      payload: { jobId, configCode },
      timestamp: new Date().toISOString(),
      correlationId: jobId
    });
  }

  static async syncCompleted(jobId: string, tenantId: string, configCode: string, result: any): Promise<void> {
    await this.publish({
      eventType: 'SYNC_COMPLETED',
      module: 'M15',
      tenantId,
      payload: { jobId, configCode, result },
      timestamp: new Date().toISOString(),
      correlationId: jobId
    });
  }

  static async syncFailed(jobId: string, tenantId: string, configCode: string, error: any): Promise<void> {
    await this.publish({
      eventType: 'SYNC_FAILED',
      module: 'M15',
      tenantId,
      payload: { jobId, configCode, error: error.message || error },
      timestamp: new Date().toISOString(),
      correlationId: jobId
    });
  }

  static async conflictDetected(conflictId: string, tenantId: string, entityType: string): Promise<void> {
    await this.publish({
      eventType: 'SYNC_CONFLICT_DETECTED',
      module: 'M15',
      tenantId,
      payload: { conflictId, entityType },
      timestamp: new Date().toISOString()
    });
  }

  static async conflictResolved(conflictId: string, tenantId: string, resolution: string): Promise<void> {
    await this.publish({
      eventType: 'SYNC_CONFLICT_RESOLVED',
      module: 'M15',
      tenantId,
      payload: { conflictId, resolution },
      timestamp: new Date().toISOString()
    });
  }

  static async backupCompleted(jobId: string, tenantId: string, scope: string): Promise<void> {
    await this.publish({
      eventType: 'BACKUP_COMPLETED',
      module: 'M15',
      tenantId,
      payload: { jobId, scope },
      timestamp: new Date().toISOString()
    });
  }

  static async integrationHealthChanged(integrationId: string, tenantId: string, status: string): Promise<void> {
    await this.publish({
      eventType: 'INTEGRATION_HEALTH_CHANGED',
      module: 'M15',
      tenantId,
      payload: { integrationId, status },
      timestamp: new Date().toISOString()
    });
  }
}
