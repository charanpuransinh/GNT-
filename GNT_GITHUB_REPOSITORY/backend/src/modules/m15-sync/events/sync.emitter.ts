// M15 Sync Module — Event Emitter
// GNT Team C | Modular Monolith Architecture
//
// Local (in-module) handlers + a forward onto the shared in-process event bus
// (`@/common/events/event-bus`) so sync/backup/conflict events reach other
// modules. Pehle yahan ek fake `publishToRedis` tha jo sirf `console.log`
// karta tha ("[REDIS PUBLISH] ...") — koi Redis hai hi nahi; woh hata diya.

import { eventBus } from '@/common/events/event-bus';

type EventHandler = (payload: unknown) => void | Promise<void>;

export class EventEmitter {
  private handlers: Map<string, EventHandler[]> = new Map();

  on(event: string, handler: EventHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(handler);
  }

  off(event: string, handler: EventHandler): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      this.handlers.set(event, handlers.filter(h => h !== handler));
    }
  }

  async emit(event: string, payload: unknown): Promise<void> {
    // Local (in-module) handlers
    const handlers = this.handlers.get(event) || [];
    for (const handler of handlers) {
      try {
        await handler(payload);
      } catch (err) {
        console.error(`Event handler error for ${event}:`, err);
      }
    }

    // Cross-module: forward onto the shared in-process bus (namespaced `m15.`)
    try {
      await eventBus.publish(`m15.${event}`, payload as Record<string, unknown>);
    } catch (err) {
      console.error(`[M15] bus publish failed for m15.${event}:`, err);
    }
  }
}

// Predefined event types for M15
export const M15_EVENTS = {
  // Sync events
  SYNC_STARTED: 'sync.started',
  SYNC_COMPLETED: 'sync.completed',
  SYNC_FAILED: 'sync.failed',
  SYNC_JOB_CREATED: 'sync.job.created',
  SYNC_JOB_UPDATED: 'sync.job.updated',
  SYNC_JOB_DELETED: 'sync.job.deleted',

  // Conflict events
  CONFLICT_CREATED: 'conflict.created',
  CONFLICT_RESOLVED: 'conflict.resolved',
  CONFLICT_IGNORED: 'conflict.ignored',

  // Backup events
  BACKUP_SCHEDULED: 'backup.scheduled',
  BACKUP_STARTED: 'backup.started',
  BACKUP_COMPLETED: 'backup.completed',
  BACKUP_FAILED: 'backup.failed',
  BACKUP_DELETED: 'backup.deleted',

  // Restore events
  RESTORE_QUEUED: 'restore.queued',
  RESTORE_STARTED: 'restore.started',
  RESTORE_COMPLETED: 'restore.completed',
  RESTORE_FAILED: 'restore.failed',
  RESTORE_ROLLED_BACK: 'restore.rolled_back',
} as const;
