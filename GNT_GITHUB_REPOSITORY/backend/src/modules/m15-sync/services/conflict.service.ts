// M15 Sync Module — Conflict Resolution Service
// GNT Team C | Modular Monolith Architecture

import { PrismaClient } from '@prisma/client';
import { SyncConflict, ResolveConflictDTO, ConflictResolutionStrategy } from '../types/sync.types';
import { AppError } from '../utils/sync.errors';
import { EventEmitter } from '../events/sync.emitter';

export class ConflictService {
  constructor(private prisma: PrismaClient, private eventEmitter: EventEmitter) {}

  async getAllConflicts(tenantId: string, opts: { page: number; limit: number; status?: string; entityType?: string }) {
    const { page, limit, status, entityType } = opts;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (status) where.status = status;
    if (entityType) where.entityType = entityType;

    const [conflicts, total] = await Promise.all([
      this.prisma.syncConflict.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.syncConflict.count({ where })
    ]);

    return { conflicts, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getConflictById(tenantId: string, id: string): Promise<SyncConflict | null> {
    return this.prisma.syncConflict.findFirst({ where: { id, tenantId } }) as Promise<SyncConflict | null>;
  }

  async resolveConflict(tenantId: string, id: string, dto: ResolveConflictDTO, userId: string): Promise<SyncConflict> {
    const conflict = await this.getConflictById(tenantId, id);
    if (!conflict) throw new AppError('CONFLICT_NOT_FOUND', 'Conflict not found', 404);
    if (conflict.status === 'resolved') throw new AppError('CONFLICT_ALREADY_RESOLVED', 'Conflict already resolved', 409);

    let resolvedVersion = dto.resolvedVersion;

    // Auto-resolve if strategy is not manual
    if (dto.resolution !== 'manual') {
      resolvedVersion = this.applyResolutionStrategy(conflict, dto.resolution);
    }

    if (!resolvedVersion) {
      throw new AppError('RESOLVED_VERSION_REQUIRED', 'Resolved version required for manual resolution', 400);
    }

    const updated = await this.prisma.syncConflict.update({
      where: { id },
      data: {
        resolution: dto.resolution,
        resolvedVersion: resolvedVersion as any,
        resolvedBy: userId,
        resolvedAt: new Date(),
        status: 'resolved',
        notes: dto.notes
      }
    }) as SyncConflict;

    // Queue the resolved version for sync
    await this.prisma.syncQueueItem.create({
      data: {
        tenantId,
        syncJobId: conflict.syncJobId,
        operation: 'push',
        entityType: conflict.entityType,
        entityId: conflict.entityId,
        payload: { data: resolvedVersion, checksum: '', version: 1 },
        status: 'pending'
      }
    });

    this.eventEmitter.emit('conflict.resolved', { tenantId, conflictId: id, resolution: dto.resolution });
    return updated;
  }

  private applyResolutionStrategy(conflict: SyncConflict, strategy: ConflictResolutionStrategy): Record<string, unknown> {
    switch (strategy) {
      case 'local_wins':
        return conflict.localVersion;
      case 'remote_wins':
        return conflict.remoteVersion;
      case 'merge':
        return this.mergeVersions(conflict.localVersion, conflict.remoteVersion);
      default:
        throw new AppError('INVALID_RESOLUTION_STRATEGY', 'Invalid resolution strategy', 400);
    }
  }

  private mergeVersions(local: Record<string, unknown>, remote: Record<string, unknown>): Record<string, unknown> {
    const merged = { ...remote };
    for (const [key, value] of Object.entries(local)) {
      if (merged[key] === undefined || (typeof value === 'number' && (merged[key] as number) < value)) {
        merged[key] = value;
      }
    }
    return merged;
  }

  async ignoreConflict(tenantId: string, id: string): Promise<SyncConflict> {
    const conflict = await this.getConflictById(tenantId, id);
    if (!conflict) throw new AppError('CONFLICT_NOT_FOUND', 'Conflict not found', 404);

    const updated = await this.prisma.syncConflict.update({
      where: { id },
      data: { status: 'ignored', resolvedAt: new Date() }
    }) as SyncConflict;

    this.eventEmitter.emit('conflict.ignored', { tenantId, conflictId: id });
    return updated;
  }

  async getConflictStats(tenantId: string) {
    const [open, resolved, ignored, total] = await Promise.all([
      this.prisma.syncConflict.count({ where: { tenantId, status: 'open' } }),
      this.prisma.syncConflict.count({ where: { tenantId, status: 'resolved' } }),
      this.prisma.syncConflict.count({ where: { tenantId, status: 'ignored' } }),
      this.prisma.syncConflict.count({ where: { tenantId } })
    ]);

    return { open, resolved, ignored, total };
  }
}
