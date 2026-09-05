/**
 * M15 — Backup service (asli local-file backup) ki jaanch — nakli prisma + temp dir.
 */
import { test, beforeAll, afterAll, expect } from 'vitest';
import { mkdtemp, readFile, rm } from 'fs/promises';
import os from 'os';
import path from 'path';
import { createHash } from 'crypto';
import { BackupService } from './backup.service';

let tmpDir: string;
beforeAll(async () => {
  tmpDir = await mkdtemp(path.join(os.tmpdir(), 'm15-backup-'));
  process.env.M15_BACKUP_DIR = tmpDir;
});
afterAll(async () => {
  await rm(tmpDir, { recursive: true, force: true });
  delete process.env.M15_BACKUP_DIR;
});

function makePrisma() {
  const updates: any[] = [];
  const syncRow = { id: 's1', tenantId: 'c1' };
  const findMany = async () => [syncRow];
  const prisma: any = {
    backupJob: {
      create: async ({ data }: any) => ({ id: 'b1', tenantId: 'c1', ...data }),
      findFirst: async () => ({
        id: 'b1', tenantId: 'c1', name: 't', status: 'scheduled', storageType: 'local',
        tablesIncluded: [], retentionDays: 30, expiresAt: new Date(), createdAt: new Date(),
        storagePath: null, fileSize: null, checksum: null,
      }),
      update: async ({ data }: any) => { updates.push(data); return { id: 'b1', ...data }; },
    },
    syncConfig: { findMany },
    syncJob: { findMany },
    syncEntityLog: { findMany },
    syncConflict: { findMany },
    syncState: { findMany },
    syncQueueItem: { findMany },
  };
  return { prisma, updates };
}

test('M15 backup: asli file likhta hai, real checksum + real size', async () => {
  const { prisma, updates } = makePrisma();
  const svc = new BackupService(prisma, { emit: () => {} } as any);

  await svc.createBackup('c1', { name: 't', backupType: 'full', storageType: 'local', tablesIncluded: [] });

  // async executeBackup पूरा होने तक wait
  await new Promise((r) => setTimeout(r, 80));

  const completed = updates.find((u) => u.status === 'completed');
  expect(completed).toBeTruthy();
  expect(completed.storagePath).toBeTruthy();

  const raw = await readFile(completed.storagePath, 'utf8');
  const parsed = JSON.parse(raw);
  expect(parsed.tenantId).toBe('c1');
  expect(parsed.tables.syncConfig).toHaveLength(1);
  expect(parsed.tables.syncJob).toHaveLength(1);

  // checksum file-content का sha256 हो, size असली byte count हो (random/fake नहीं)
  expect(completed.checksum).toBe(createHash('sha256').update(raw).digest('hex'));
  expect(Number(completed.fileSize)).toBe(Buffer.byteLength(raw, 'utf8'));
});
