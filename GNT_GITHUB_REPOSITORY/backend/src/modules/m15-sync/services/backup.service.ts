// M15 Sync Module — Backup & Restore Service
// GNT Team C | Modular Monolith Architecture

import { PrismaClient } from '@prisma/client';
import { BackupJob, CreateBackupDTO, RestoreJob } from '../types/sync.types';
import { AppError } from '../utils/sync.errors';
import { EventEmitter } from '../events/sync.emitter';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

// M15 के अपने metadata tables जिनका local backup/restore safe है (कोई financial master नहीं)।
const BACKUP_TABLES = ['syncConfig', 'syncJob', 'syncEntityLog', 'syncConflict', 'syncState', 'syncQueueItem'] as const;

function backupDir(): string {
  return process.env.M15_BACKUP_DIR || path.join(process.cwd(), 'storage', 'backups');
}

export class BackupService {
  constructor(private prisma: PrismaClient, private eventEmitter: EventEmitter) {}

  async getAllBackups(tenantId: string, opts: { page: number; limit: number }) {
    const { page, limit } = opts;
    const skip = (page - 1) * limit;

    const [backups, total] = await Promise.all([
      this.prisma.backupJob.findMany({
        where: { tenantId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.backupJob.count({ where: { tenantId } })
    ]);

    return { backups, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getBackupById(tenantId: string, id: string): Promise<BackupJob | null> {
    return this.prisma.backupJob.findFirst({ where: { id, tenantId } }) as Promise<BackupJob | null>;
  }

  async createBackup(tenantId: string, dto: CreateBackupDTO): Promise<BackupJob> {
    const backup = await this.prisma.backupJob.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
        backupType: dto.backupType,
        status: 'scheduled',
        storageType: dto.storageType,
        tablesIncluded: dto.tablesIncluded,
        retentionDays: dto.retentionDays || 30,
        expiresAt: new Date(Date.now() + (dto.retentionDays || 30) * 24 * 60 * 60 * 1000)
      }
    }) as BackupJob;

    // Trigger async backup execution
    this.executeBackup(tenantId, backup.id).catch(console.error);

    this.eventEmitter.emit('backup.scheduled', { tenantId, backupId: backup.id });
    return backup;
  }

  private async executeBackup(tenantId: string, backupId: string): Promise<void> {
    const backup = await this.prisma.backupJob.findFirst({ where: { id: backupId, tenantId } });
    if (!backup) return;

    await this.prisma.backupJob.update({
      where: { id: backupId },
      data: { status: 'running', startedAt: new Date() }
    });

    this.eventEmitter.emit('backup.started', { tenantId, backupId });

    try {
      // असली local-file backup: tenant की sync metadata tables dump करो, असली checksum + size
      const tables: Record<string, unknown[]> = {};
      for (const table of BACKUP_TABLES) {
        const accessor = (this.prisma as unknown as Record<string, { findMany?: (a: unknown) => Promise<unknown[]> }>)[table];
        if (accessor?.findMany) {
          tables[table] = await accessor.findMany({ where: { tenantId } });
        }
      }

      const payload = JSON.stringify({
        version: 1,
        tenantId,
        createdAt: new Date().toISOString(),
        tables,
      });

      const dir = path.join(backupDir(), tenantId);
      await fs.mkdir(dir, { recursive: true });
      const filePath = path.join(dir, `${backupId}.json`);
      await fs.writeFile(filePath, payload, 'utf8');

      const checksum = createHash('sha256').update(payload).digest('hex');
      const fileSize = BigInt(Buffer.byteLength(payload, 'utf8'));

      await this.prisma.backupJob.update({
        where: { id: backupId },
        data: {
          status: 'completed',
          fileSize,
          checksum,
          storagePath: filePath,
          completedAt: new Date()
        }
      });

      this.eventEmitter.emit('backup.completed', { tenantId, backupId });
    } catch (error: any) {
      await this.prisma.backupJob.update({
        where: { id: backupId },
        data: { status: 'failed', errorMessage: error.message, completedAt: new Date() }
      });

      this.eventEmitter.emit('backup.failed', { tenantId, backupId, error: error.message });
    }
  }

  async deleteBackup(tenantId: string, id: string): Promise<void> {
    const backup = await this.getBackupById(tenantId, id);
    if (!backup) throw new AppError('BACKUP_NOT_FOUND', 'Backup not found', 404);

    // असली file भी हटाओ (हो तो), फिर DB record
    if (backup.storagePath) {
      await fs.unlink(backup.storagePath).catch(() => {});
    }
    await this.prisma.backupJob.delete({ where: { id } });
    this.eventEmitter.emit('backup.deleted', { tenantId, backupId: id });
  }

  async restoreBackup(tenantId: string, backupId: string): Promise<RestoreJob> {
    const backup = await this.getBackupById(tenantId, backupId);
    if (!backup) throw new AppError('BACKUP_NOT_FOUND', 'Backup not found', 404);
    if (backup.status !== 'completed') throw new AppError('BACKUP_NOT_READY', 'Backup not ready for restore', 400);

    const restoreJob = await this.prisma.restoreJob.create({
      data: {
        tenantId,
        backupJobId: backupId,
        status: 'queued',
        tablesRestored: [],
        recordsRestored: 0
      }
    }) as RestoreJob;

    // Trigger async restore
    this.executeRestore(tenantId, restoreJob.id).catch(console.error);

    this.eventEmitter.emit('restore.queued', { tenantId, backupId, restoreJobId: restoreJob.id });
    return restoreJob;
  }

  private async executeRestore(tenantId: string, restoreJobId: string): Promise<void> {
    await this.prisma.restoreJob.update({
      where: { id: restoreJobId },
      data: { status: 'running', startedAt: new Date() }
    });

    this.eventEmitter.emit('restore.started', { tenantId, restoreJobId });

    try {
      const restore = await this.prisma.restoreJob.findFirst({
        where: { id: restoreJobId, tenantId },
        include: { backupJob: true }
      });
      if (!restore?.backupJob?.storagePath) {
        throw new Error('Backup file not found for restore');
      }

      const raw = await fs.readFile(restore.backupJob.storagePath, 'utf8');
      const parsed = JSON.parse(raw) as { tables?: Record<string, unknown[]> };

      let recordsRestored = 0;
      const tablesRestored: string[] = [];

      await this.prisma.$transaction(async (tx) => {
        const txModels = tx as unknown as Record<string, { deleteMany: (a: unknown) => Promise<unknown>; createMany: (a: unknown) => Promise<unknown> }>;
        for (const table of BACKUP_TABLES) {
          const rows = parsed.tables?.[table];
          if (!Array.isArray(rows) || rows.length === 0) continue;
          const model = txModels[table];
          if (!model?.deleteMany || !model?.createMany) continue;
          await model.deleteMany({ where: { tenantId } });
          await model.createMany({ data: rows.map((r: any) => ({ ...r, tenantId })) });
          recordsRestored += rows.length;
          tablesRestored.push(table);
        }
      });

      await this.prisma.restoreJob.update({
        where: { id: restoreJobId },
        data: {
          status: 'completed',
          tablesRestored,
          recordsRestored,
          completedAt: new Date()
        }
      });

      this.eventEmitter.emit('restore.completed', { tenantId, restoreJobId });
    } catch (error: any) {
      await this.prisma.restoreJob.update({
        where: { id: restoreJobId },
        data: { status: 'failed', errorMessage: error.message }
      });

      this.eventEmitter.emit('restore.failed', { tenantId, restoreJobId, error: error.message });
    }
  }

  async getRestoreJobs(tenantId: string, opts: { page: number; limit: number }) {
    const { page, limit } = opts;
    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      this.prisma.restoreJob.findMany({
        where: { tenantId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { backupJob: { select: { name: true, backupType: true } } }
      }),
      this.prisma.restoreJob.count({ where: { tenantId } })
    ]);

    return { jobs, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async rollbackRestore(tenantId: string, restoreJobId: string, reason: string): Promise<RestoreJob> {
    const job = await this.prisma.restoreJob.findFirst({ where: { id: restoreJobId, tenantId } });
    if (!job) throw new AppError('RESTORE_JOB_NOT_FOUND', 'Restore job not found', 404);

    const updated = await this.prisma.restoreJob.update({
      where: { id: restoreJobId },
      data: {
        status: 'rolled_back',
        rolledBackAt: new Date(),
        rollbackReason: reason
      }
    }) as RestoreJob;

    this.eventEmitter.emit('restore.rolled_back', { tenantId, restoreJobId, reason });
    return updated;
  }
}
