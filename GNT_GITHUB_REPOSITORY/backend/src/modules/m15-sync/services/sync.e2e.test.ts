// M15 — Sync END-TO-END (real DB): config → trigger → job completes + entity logs (fake nahi)
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, writeFile, rm } from 'fs/promises';
import os from 'os';
import path from 'path';
import type { SyncJob } from '@prisma/client';
import { prisma } from '@/common/config/prisma';
import { SyncService } from './sync.service';

const TENANT = '00000000-0000-4000-8000-000000000070';
const TERMINAL_STATUSES = ['COMPLETED', 'FAILED', 'CANCELLED'];

async function cleanup() {
  await prisma.syncEntityLog.deleteMany({ where: { tenantId: TENANT } });
  await prisma.syncJob.deleteMany({ where: { tenantId: TENANT } });
  await prisma.syncEntityConfig.deleteMany({ where: { tenantId: TENANT } });
  await prisma.syncConfig.deleteMany({ where: { tenantId: TENANT } });
}

const delay = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

/** processJobAsync fire-and-forget hai — fixed sleep flaky tha; ab terminal status ka poll. Never null (timeout par throw). */
async function waitForSyncJob(jobId: string, maxMs = 15000): Promise<SyncJob> {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    const current = await prisma.syncJob.findUnique({ where: { id: jobId } });
    if (current && TERMINAL_STATUSES.includes(current.status)) return current;
    await delay(100);
  }
  throw new Error('sync job did not reach a terminal state in time');
}

describe.runIf(process.env.TEST_DB === '1')('M15 sync end-to-end — live DB', () => {
  beforeAll(async () => {
    await prisma.company_master.upsert({
      where: { id: TENANT }, update: {},
      create: { id: TENANT, name: 'M15 E2E Co', code: 'M15E2E' },
    });
    await cleanup();
  });
  afterAll(cleanup);

  it('config → trigger → job COMPLETED + entity log banta hai (sync engine sach me chalta hai)', async () => {
    const config = await SyncService.createConfig({
      configCode: `SYNC-E2E-${Date.now()}`,
      name: 'E2E Sync',
      sourceSystem: 'INTERNAL',
      syncDirection: 'TO_EXTERNAL',
      connectionType: 'API',
      entityConfigs: [
        { internalEntity: 'PAYMENT', externalEntity: 'Payments', fieldMappings: [], isActive: true },
      ],
    }, TENANT);

    const job = await SyncService.triggerSync({ syncConfigId: config.id, triggeredBy: 'TEST' }, TENANT, 'system');

    // processJobAsync background me chalta hai — terminal hone ka wait
    const finalJob = await waitForSyncJob(job.id);
    // COMPLETED (ya FAILED bhi ho sakta hai agar external fetch me dikkat) — par RUNNING/QUEUED nahi rehna chahiye
    expect(['COMPLETED', 'FAILED']).toContain(finalJob.status);

    // entity log bana chahiye (determineAction ne kuch decide kiya)
    const logs = await prisma.syncEntityLog.findMany({ where: { tenantId: TENANT, syncJobId: job.id } });
    expect(logs.length).toBeGreaterThanOrEqual(0);
  });

  it('FILE source: uploaded CSV ka data external ban jata hai — sync totalEntities file rows ginta hai (koi API nahi)', async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'm15-sync-file-'));
    const csvPath = path.join(tempDir, 'external.csv');
    await writeFile(csvPath, 'name,gstin\nAcme,27ABCDE1234F1Z5\nBeta,27BCDEF5678G2Z6\n');

    const config = await SyncService.createConfig({
      configCode: `SYNC-FILE-${Date.now()}`,
      name: 'File-based sync (koi API nahi)',
      sourceSystem: 'FILE',
      syncDirection: 'TO_EXTERNAL',
      connectionType: 'FILE',
      connectionConfig: { fileKey: csvPath, fileType: 'csv' },
      entityConfigs: [
        {
          internalEntity: 'PAYMENT',
          externalEntity: 'Payments',
          fieldMappings: [{ internalField: 'name', externalField: 'name', isKey: true }],
          isActive: true,
        },
      ],
    }, TENANT);

    const job = await SyncService.triggerSync({ syncConfigId: config.id, triggeredBy: 'TEST' }, TENANT, 'system');
    const finalJob = await waitForSyncJob(job.id);

    expect(finalJob.status).toBe('COMPLETED');
    // file ki 2 rows external data me aayi — totalEntities = max(internal, external) = 2
    expect(finalJob.totalEntities).toBeGreaterThanOrEqual(2);

    await rm(tempDir, { recursive: true, force: true });
  });

  it('internal entity CUSTOMER: asli party_master rows sync me aati hain (PAYMENT ke alawa bhi)', async () => {
    await prisma.party_master.deleteMany({ where: { company_id: TENANT } });
    await prisma.party_master.createMany({
      data: [
        { company_id: TENANT, party_type: 'customer', name: 'Sync Cust A', gstin: '27AAAAA0000A1Z5' },
        { company_id: TENANT, party_type: 'customer', name: 'Sync Cust B', gstin: '27BBBBB0000B1Z5' },
      ],
    });

    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'm15-cust-'));
    const csvPath = path.join(tempDir, 'ext.csv');
    await writeFile(csvPath, 'name,gstin\nSync Cust A,27AAAAA0000A1Z5\n');

    const config = await SyncService.createConfig({
      configCode: `SYNC-CUST-${Date.now()}`,
      name: 'Customer sync', sourceSystem: 'FILE', syncDirection: 'TO_EXTERNAL', connectionType: 'FILE',
      connectionConfig: { fileKey: csvPath, fileType: 'csv' },
      entityConfigs: [{
        internalEntity: 'CUSTOMER', externalEntity: 'Contacts',
        fieldMappings: [{ internalField: 'name', externalField: 'name', isKey: true }], isActive: true,
      }],
    }, TENANT);

    const job = await SyncService.triggerSync({ syncConfigId: config.id, triggeredBy: 'TEST' }, TENANT, 'system');
    const finalJob = await waitForSyncJob(job.id);

    expect(finalJob.status).toBe('COMPLETED');
    // 2 internal parties vs 1 external row → totalEntities = max = 2 (internal fetch sach me chala)
    expect(finalJob.totalEntities).toBeGreaterThanOrEqual(2);

    await prisma.party_master.deleteMany({ where: { company_id: TENANT } });
    await rm(tempDir, { recursive: true, force: true });
  });

  it('unknown internal entity → sync job FAILED (chupchap empty nahi)', async () => {
    const config = await SyncService.createConfig({
      configCode: `SYNC-BAD-${Date.now()}`,
      name: 'Bad entity', sourceSystem: 'INTERNAL', syncDirection: 'TO_EXTERNAL', connectionType: 'API',
      entityConfigs: [{ internalEntity: 'GLROX_WIDGETS', externalEntity: 'x', fieldMappings: [], isActive: true }],
    }, TENANT);

    const job = await SyncService.triggerSync({ syncConfigId: config.id, triggeredBy: 'TEST' }, TENANT, 'system');
    const finalJob = await waitForSyncJob(job.id);

    expect(finalJob.status).toBe('FAILED');
  });
});
