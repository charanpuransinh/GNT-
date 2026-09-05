import { PrismaClient, SyncConfig, SyncJob, SyncEntityLog, SyncConflict, SyncState, BackupJob } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import {
  CreateSyncConfigRequest,
  UpdateSyncConfigRequest,
  TriggerSyncRequest,
  SyncEntityRequest,
  SyncPreviewResponse,
  SyncProgress
} from '../types/sync.types';

const prisma = new PrismaClient();
const progressEmitter = new EventEmitter();

export class SyncService {
  // ── Sync Config CRUD ────────────────────────────────────

  static async createConfig(data: CreateSyncConfigRequest, tenantId: string): Promise<SyncConfig> {
    return prisma.syncConfig.create({
      data: {
        tenantId,
        configCode: data.configCode,
        name: data.name,
        description: data.description,
        sourceSystem: data.sourceSystem,
        sourceVersion: data.sourceVersion,
        syncDirection: data.syncDirection,
        connectionType: data.connectionType,
        connectionConfig: (data.connectionConfig ?? {}) as never,
        syncMode: data.syncMode || 'MANUAL',
        cronExpression: data.cronExpression,
        entityConfigs: {
          create: data.entityConfigs.map(ec => ({
            tenantId,
            internalEntity: ec.internalEntity,
            externalEntity: ec.externalEntity ?? '',
            fieldMappings: (ec.fieldMappings ?? []) as never,
            syncDirection: ec.syncDirection || data.syncDirection,
            sourceFilter: (ec.sourceFilter ?? null) as never,
            targetFilter: (ec.targetFilter ?? null) as never,
            conflictResolution: ec.conflictResolution || 'INTERNAL_WINS',
            syncMode: ec.syncMode,
            cronExpression: ec.cronExpression,
            isActive: ec.isActive ?? true
          }))
        }
      },
      include: { entityConfigs: true }
    });
  }

  static async getConfig(id: string, tenantId: string): Promise<SyncConfig | null> {
    return prisma.syncConfig.findFirst({
      where: { id, tenantId },
      include: { entityConfigs: true }
    });
  }

  static async getConfigByCode(configCode: string, tenantId: string): Promise<SyncConfig | null> {
    return prisma.syncConfig.findFirst({
      where: { configCode, tenantId },
      include: { entityConfigs: true }
    });
  }

  static async listConfigs(tenantId: string, filters?: { sourceSystem?: string; status?: string }): Promise<SyncConfig[]> {
    return prisma.syncConfig.findMany({
      where: {
        tenantId,
        ...(filters?.sourceSystem && { sourceSystem: filters.sourceSystem }),
        ...(filters?.status && { status: filters.status })
      },
      include: { entityConfigs: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async updateConfig(id: string, tenantId: string, data: UpdateSyncConfigRequest): Promise<SyncConfig> {
    const result = await prisma.syncConfig.updateMany({
      where: { id, tenantId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.syncDirection && { syncDirection: data.syncDirection }),
        ...(data.connectionConfig && { connectionConfig: data.connectionConfig as never }),
        ...(data.syncMode && { syncMode: data.syncMode }),
        ...(data.cronExpression !== undefined && { cronExpression: data.cronExpression }),
        ...(data.status && { status: data.status }),
        ...(data.errorThreshold !== undefined && { errorThreshold: data.errorThreshold })
      }
    });
    if (result.count === 0) throw new Error('Sync config not found');
    const config = await prisma.syncConfig.findFirst({ where: { id, tenantId }, include: { entityConfigs: true } });
    if (!config) throw new Error('Sync config not found');
    return config;
  }

  static async deleteConfig(id: string, tenantId: string): Promise<SyncConfig> {
    const existing = await prisma.syncConfig.findFirst({ where: { id, tenantId } });
    if (!existing) throw new Error('Sync config not found');
    await prisma.syncConfig.deleteMany({ where: { id, tenantId } });
    return existing;
  }

  // ── Sync Job Engine ─────────────────────────────────────

  static async triggerSync(data: TriggerSyncRequest, tenantId: string, userId?: string): Promise<SyncJob> {
    const config = await prisma.syncConfig.findFirst({
      where: { id: data.syncConfigId, tenantId },
      include: { entityConfigs: true }
    });

    if (!config) throw new Error('Sync config not found');
    if (config.status === 'PAUSED') throw new Error('Sync config is paused');
    if (config.status === 'DISABLED') throw new Error('Sync config is disabled');
    if (config.consecutiveErrors >= config.errorThreshold) {
      throw new Error(`Sync config auto-paused after ${config.consecutiveErrors} consecutive errors`);
    }

    const jobNumber = `SYN-${new Date().getFullYear()}-${String(await this.getNextJobSequence()).padStart(6, '0')}`;

    const job = await prisma.syncJob.create({
      data: {
        tenantId,
        jobNumber,
        syncConfigId: data.syncConfigId,
        triggeredBy: data.triggeredBy || 'USER',
        triggeredByUser: userId,
        entityType: data.entityType,
        status: 'QUEUED'
      }
    });

    // Queue for async processing (BullMQ in production)
    this.processJobAsync(job.id).catch(console.error);

    return job;
  }

  private static async processJobAsync(jobId: string): Promise<void> {
    const job = await prisma.syncJob.findUnique({
      where: { id: jobId },
      include: { syncConfig: { include: { entityConfigs: true } } }
    });
    if (!job) return;

    await prisma.syncJob.update({
      where: { id: jobId },
      data: { status: 'RUNNING', startedAt: new Date() }
    });

    const startTime = Date.now();
    const config = job.syncConfig;
    const entityConfigs = config.entityConfigs.filter(ec =>
      !job.entityType || ec.internalEntity === job.entityType
    );

    let totalEntities = 0;
    let processed = 0;
    let created = 0;
    let updated = 0;
    let deleted = 0;
    let skipped = 0;
    let errors = 0;
    let conflicts = 0;

    try {
      for (const entityConfig of entityConfigs) {
        if (!entityConfig.isActive) continue;

        // Fetch internal and external data (mock implementation)
        const internalData = await this.fetchInternalEntities(entityConfig.internalEntity, job.tenantId);
        const externalData = await this.fetchExternalEntities(config, entityConfig);

        totalEntities += Math.max(internalData.length, externalData.length);

        for (const item of internalData) {
          const externalMatch = externalData.find(e =>
            this.matchByKey(item, e, entityConfig.fieldMappings as any)
          );

          const action = await this.determineAction(
            item, externalMatch, entityConfig.syncDirection, config.syncDirection
          );

          const logData: any = {
            tenantId: job.tenantId,
            syncJobId: job.id,
            entityType: entityConfig.internalEntity,
            internalId: item.id,
            externalId: externalMatch?.id,
            direction: action.direction,
            action: action.action,
            internalData: item,
            externalData: externalMatch,
            status: 'SUCCESS'
          };

          if (action.action === 'CONFLICT') {
            await prisma.syncConflict.create({
              data: {
                tenantId: job.tenantId,
                syncJobId: job.id,
                entityType: entityConfig.internalEntity,
                internalId: item.id,
                externalId: externalMatch?.id || 'unknown',
                conflictType: 'UPDATE_BOTH',
                internalValue: item,
                externalValue: externalMatch,
                resolution: entityConfig.conflictResolution
              }
            });
            logData.status = 'CONFLICT';
            conflicts++;
          } else if (action.action === 'CREATE') {
            created++;
          } else if (action.action === 'UPDATE') {
            updated++;
          } else if (action.action === 'DELETE') {
            deleted++;
          } else if (action.action === 'SKIP') {
            skipped++;
          }

          await prisma.syncEntityLog.create({ data: logData });
          processed++;

          // Emit progress
          progressEmitter.emit('progress', {
            jobId: job.id,
            jobNumber: job.jobNumber,
            status: 'RUNNING',
            totalEntities,
            processedEntities: processed,
            createdCount: created,
            updatedCount: updated,
            deletedCount: deleted,
            skippedCount: skipped,
            errorCount: errors,
            conflictCount: conflicts,
            percentComplete: Math.round((processed / totalEntities) * 100),
            currentEntity: entityConfig.internalEntity
          } as SyncProgress);
        }
      }

      const duration = Date.now() - startTime;

      await prisma.syncJob.update({
        where: { id: jobId },
        data: {
          status: errors > 0 ? 'COMPLETED' : 'COMPLETED',
          totalEntities,
          processedEntities: processed,
          createdCount: created,
          updatedCount: updated,
          deletedCount: deleted,
          skippedCount: skipped,
          errorCount: errors,
          conflictCount: conflicts,
          completedAt: new Date(),
          durationMs: duration,
          resultSummary: {
            entitiesProcessed: processed,
            created,
            updated,
            deleted,
            skipped,
            conflicts,
            errors
          }
        }
      });

      await prisma.syncConfig.update({
        where: { id: config.id },
        data: {
          lastSyncAt: new Date(),
          lastSyncStatus: conflicts > 0 ? 'PARTIAL' : 'SUCCESS',
          lastSyncJobId: job.id,
          consecutiveErrors: 0
        }
      });

      // Update sync state watermark
      await this.updateSyncState(config.id, entityConfigs[0]?.internalEntity || 'ALL', job.id, job.tenantId);

    } catch (error: any) {
      await prisma.syncJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          durationMs: Date.now() - startTime,
          errorSummary: { message: error.message, stack: error.stack }
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

  private static async determineAction(
    internal: any, external: any | undefined,
    entityDirection: string, configDirection: string
  ): Promise<{ action: string; direction: string }> {
    const direction = entityDirection !== 'BIDIRECTIONAL' ? entityDirection : configDirection;

    if (!external && (direction === 'TO_EXTERNAL' || direction === 'BIDIRECTIONAL')) {
      return { action: 'CREATE', direction: 'TO_EXTERNAL' };
    }
    if (!internal && (direction === 'FROM_EXTERNAL' || direction === 'BIDIRECTIONAL')) {
      return { action: 'CREATE', direction: 'FROM_EXTERNAL' };
    }
    if (!internal && !external) {
      return { action: 'SKIP', direction };
    }

    // Check for actual changes
    const hasChanges = JSON.stringify(internal) !== JSON.stringify(external);
    if (!hasChanges) {
      return { action: 'SKIP', direction };
    }

    if (direction === 'TO_EXTERNAL') return { action: 'UPDATE', direction: 'TO_EXTERNAL' };
    if (direction === 'FROM_EXTERNAL') return { action: 'UPDATE', direction: 'FROM_EXTERNAL' };

    // BIDIRECTIONAL — check for conflicts
    const internalUpdated = new Date(internal.updatedAt || 0);
    const externalUpdated = new Date(external.updatedAt || 0);

    if (Math.abs(internalUpdated.getTime() - externalUpdated.getTime()) < 5000) {
      return { action: 'CONFLICT', direction: 'BIDIRECTIONAL' };
    }

    return { action: 'UPDATE', direction: internalUpdated > externalUpdated ? 'TO_EXTERNAL' : 'FROM_EXTERNAL' };
  }

  private static matchByKey(internal: any, external: any, mappings: any[]): boolean {
    const keyMappings = mappings.filter(m => m.isKey);
    if (keyMappings.length === 0) return internal.id === external.id;
    return keyMappings.every(m => internal[m.internalField] === external[m.externalField]);
  }

  private static async fetchInternalEntities(entityType: string, tenantId: string): Promise<any[]> {
    // PUBLIC API CALL: Query the entity module via its public API
    // In production, this calls M05 (Inventory), M06 (Customer), M07 (Invoice), etc.
    // TEMP MOCK: Return mock data
    return Array.from({ length: 50 }, (_, i) => ({
      id: `INT-${entityType}-${i + 1}`,
      name: `${entityType} ${i + 1}`,
      code: `CODE-${i + 1}`,
      updatedAt: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString()
    }));
  }

  private static async fetchExternalEntities(config: SyncConfig, entityConfig: any): Promise<any[]> {
    // Call external system API based on connectionConfig
    // TEMP MOCK: Return mock data
    return Array.from({ length: 45 }, (_, i) => ({
      id: `EXT-${entityConfig.externalEntity}-${i + 1}`,
      name: `${entityConfig.externalEntity} ${i + 1}`,
      code: `CODE-${i + 1}`,
      updatedAt: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString()
    }));
  }

  private static async updateSyncState(syncConfigId: string, entityType: string, jobId: string, tenantId: string): Promise<void> {
    await prisma.syncState.upsert({
      where: { syncConfigId_entityType: { syncConfigId, entityType } },
      update: {
        lastSyncAt: new Date(),
        lastSyncJobId: jobId,
        watermark: { lastSyncAt: new Date().toISOString() },
        totalSynced: { increment: 1 }
      },
      create: {
        tenantId,
        syncConfigId,
        entityType,
        lastSyncAt: new Date(),
        lastSyncJobId: jobId,
        watermark: { lastSyncAt: new Date().toISOString() },
        totalSynced: 1
      }
    });
  }

  private static async getNextJobSequence(): Promise<number> {
    const count = await prisma.syncJob.count();
    return count + 1;
  }

  // ── Job Queries ─────────────────────────────────────────

  static async getJobStatus(jobId: string, tenantId: string): Promise<SyncJob | null> {
    return prisma.syncJob.findFirst({
      where: { id: jobId, tenantId },
      include: {
        syncConfig: { select: { id: true, name: true, configCode: true } },
        entityLogs: { take: 100, orderBy: { startedAt: 'desc' } },
        conflicts: { where: { status: 'PENDING' } }
      }
    });
  }

  static async listJobs(tenantId: string, filters?: { syncConfigId?: string; status?: string; limit?: number }): Promise<SyncJob[]> {
    return prisma.syncJob.findMany({
      where: {
        tenantId,
        ...(filters?.syncConfigId && { syncConfigId: filters.syncConfigId }),
        ...(filters?.status && { status: filters.status })
      },
      include: {
        syncConfig: { select: { id: true, name: true, configCode: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 50
    });
  }

  static async cancelJob(jobId: string, tenantId: string): Promise<SyncJob> {
    const job = await prisma.syncJob.findFirst({ where: { id: jobId, tenantId } });
    if (!job) throw new Error('Job not found');
    if (job.status === 'COMPLETED' || job.status === 'FAILED') {
      throw new Error('Cannot cancel a completed or failed job');
    }

    return prisma.syncJob.updateMany({
      where: { id: jobId, tenantId },
      data: { status: 'CANCELLED', completedAt: new Date() }
    }).then(async (result) => {
      if (result.count === 0) throw new Error('Job not found');
      const updated = await prisma.syncJob.findFirst({ where: { id: jobId, tenantId } });
      if (!updated) throw new Error('Job not found');
      return updated;
    });
  }

  static async getJobProgress(jobId: string, tenantId: string): Promise<SyncProgress | null> {
    const job = await prisma.syncJob.findFirst({ where: { id: jobId, tenantId } });
    if (!job) return null;

    const percent = job.totalEntities > 0
      ? Math.round((job.processedEntities / job.totalEntities) * 100)
      : 0;

    return {
      jobId: job.id,
      jobNumber: job.jobNumber,
      status: job.status,
      totalEntities: job.totalEntities,
      processedEntities: job.processedEntities,
      createdCount: job.createdCount,
      updatedCount: job.updatedCount,
      deletedCount: job.deletedCount,
      skippedCount: job.skippedCount,
      errorCount: job.errorCount,
      conflictCount: job.conflictCount,
      percentComplete: percent,
      startedAt: job.startedAt?.toISOString(),
      estimatedCompletion: job.startedAt
        ? new Date(job.startedAt.getTime() + (job.durationMs || 0) * 100 / Math.max(percent, 1)).toISOString()
        : undefined
    };
  }

  static onProgress(callback: (progress: SyncProgress) => void): () => void {
    progressEmitter.on('progress', callback);
    return () => progressEmitter.off('progress', callback);
  }

  // ── Preview Sync ──────────────────────────────────────────

  static async previewSync(syncConfigId: string, tenantId: string): Promise<SyncPreviewResponse> {
    const config = await prisma.syncConfig.findFirst({
      where: { id: syncConfigId, tenantId },
      include: { entityConfigs: true }
    });
    if (!config) throw new Error('Sync config not found');

    const entities = [];
    let totalEstimated = 0;

    for (const ec of config.entityConfigs.filter(e => e.isActive)) {
      const internal = await this.fetchInternalEntities(ec.internalEntity, tenantId);
      const external = await this.fetchExternalEntities(config, ec);
      totalEstimated += Math.max(internal.length, external.length);

      const changes = [];
      for (const item of internal.slice(0, 10)) {
        const match = external.find(e => this.matchByKey(item, e, ec.fieldMappings as any));
        if (!match) {
          changes.push({ action: 'CREATE', internalId: item.id, diff: { status: { internal: 'new', external: null } } });
        } else if (JSON.stringify(item) !== JSON.stringify(match)) {
          changes.push({ action: 'UPDATE', internalId: item.id, externalId: match.id, diff: {} });
        }
      }

      entities.push({
        entityType: ec.internalEntity,
        internalCount: internal.length,
        externalCount: external.length,
        changes
      });
    }

    return {
      jobId: 'preview-' + uuidv4(),
      jobNumber: 'PREVIEW',
      status: 'PREVIEW',
      estimatedRecords: totalEstimated,
      entities
    };
  }

  // ── Single Entity Sync ────────────────────────────────────

  static async syncEntity(data: SyncEntityRequest, tenantId: string, userId?: string): Promise<SyncJob> {
    const config = await prisma.syncConfig.findFirst({
      where: { configCode: data.syncConfigCode, tenantId },
      include: { entityConfigs: true }
    });
    if (!config) throw new Error('Sync config not found');

    const entityConfig = config.entityConfigs.find(ec => ec.internalEntity === data.entityType);
    if (!entityConfig) throw new Error('Entity type not configured for this sync');

    return this.triggerSync({
      syncConfigId: config.id,
      entityType: data.entityType,
      triggeredBy: 'API'
    }, tenantId, userId);
  }
}
