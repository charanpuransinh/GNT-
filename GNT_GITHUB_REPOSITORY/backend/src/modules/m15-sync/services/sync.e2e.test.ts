// M15 — Sync END-TO-END (real DB). Effect assertions: FROM_EXTERNAL actually
// writes internal rows; TO_EXTERNAL / unsupported entities are honestly 'detected'
// (no fake 'created'); unknown entity -> job FAILED.
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { prisma } from '@/common/config/prisma';
import type { SyncJob } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SyncService } from './sync.service';

const TENANT = '00000000-0000-4000-8000-000000000070';
const TERMINAL_STATUSES = ['COMPLETED', 'FAILED', 'CANCELLED'];

async function cleanup() {
  await prisma.syncEntityLog.deleteMany({ where: { tenantId: TENANT } });
  await prisma.syncConflict.deleteMany({ where: { tenantId: TENANT } });
  await prisma.syncJob.deleteMany({ where: { tenantId: TENANT } });
  await prisma.syncEntityConfig.deleteMany({ where: { tenantId: TENANT } });
  await prisma.syncConfig.deleteMany({ where: { tenantId: TENANT } });
  await prisma.product_master.deleteMany({ where: { company_id: TENANT } });
  await prisma.party_master.deleteMany({ where: { company_id: TENANT } });
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForSyncJob(jobId: string, maxMs = 15000): Promise<SyncJob> {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    const current = await prisma.syncJob.findUnique({ where: { id: jobId } });
    if (current && TERMINAL_STATUSES.includes(current.status)) return current;
    await delay(100);
  }
  throw new Error('sync job did not reach a terminal state in time');
}

async function fileConfig(entity: string, direction: string, csv: string, mappings: unknown[]) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'm15-e2e-'));
  const csvPath = path.join(tempDir, 'ext.csv');
  await writeFile(csvPath, csv);
  const config = await SyncService.createConfig(
    {
      configCode: `SYNC-${entity}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: `${entity} ${direction}`,
      sourceSystem: 'FILE',
      syncDirection: direction,
      connectionType: 'FILE',
      connectionConfig: { fileKey: csvPath, fileType: 'csv' },
      entityConfigs: [
        {
          internalEntity: entity,
          externalEntity: 'Ext',
          fieldMappings: mappings as never,
          isActive: true,
        },
      ],
    } as never,
    TENANT
  );
  return { config, cleanupFile: () => rm(tempDir, { recursive: true, force: true }) };
}

describe.runIf(process.env.TEST_DB === '1')('M15 sync end-to-end — live DB', () => {
  beforeAll(async () => {
    await prisma.company_master.upsert({
      where: { id: TENANT },
      update: {},
      create: { id: TENANT, name: 'M15 E2E Co', code: 'M15E2E' },
    });
    await cleanup();
  });
  afterAll(cleanup);

  it('FROM_EXTERNAL party sync WRITES a real party_master row (not just a log)', async () => {
    await prisma.party_master.deleteMany({ where: { company_id: TENANT } });
    const { config, cleanupFile } = await fileConfig(
      'CUSTOMER',
      'FROM_EXTERNAL',
      'name,gstin,email\nExternally Imported Co,27ZZZZZ0000Z1Z5,ext@imported.test\n',
      [
        { internalField: 'name', externalField: 'name', isKey: true },
        { internalField: 'gstin', externalField: 'gstin' },
        { internalField: 'email', externalField: 'email' },
      ]
    );

    const job = await SyncService.triggerSync(
      { syncConfigId: config.id, triggeredBy: 'TEST' } as never,
      TENANT,
      'system'
    );
    const finalJob = await waitForSyncJob(job.id);
    expect(finalJob.status).toBe('COMPLETED');

    // THE effect — a real internal row now exists
    const party = await prisma.party_master.findFirst({
      where: { company_id: TENANT, gstin: '27ZZZZZ0000Z1Z5' },
    });
    expect(party).toBeTruthy();
    expect(party?.name).toBe('Externally Imported Co');
    expect(party?.email).toBe('ext@imported.test');

    // honest counters
    const summary = finalJob.resultSummary as Record<string, number>;
    expect(summary.created).toBeGreaterThanOrEqual(1);
    await cleanupFile();
  });

  it('FROM_EXTERNAL re-run UPDATES the existing party (upsert, not duplicate)', async () => {
    const { config, cleanupFile } = await fileConfig(
      'CUSTOMER',
      'FROM_EXTERNAL',
      'name,gstin,email\nExternally Imported Co,27ZZZZZ0000Z1Z5,changed@imported.test\n',
      [
        { internalField: 'name', externalField: 'name', isKey: true },
        { internalField: 'gstin', externalField: 'gstin' },
        { internalField: 'email', externalField: 'email' },
      ]
    );
    const job = await SyncService.triggerSync(
      { syncConfigId: config.id, triggeredBy: 'TEST' } as never,
      TENANT,
      'system'
    );
    const finalJob = await waitForSyncJob(job.id);
    expect(finalJob.status).toBe('COMPLETED');

    const rows = await prisma.party_master.findMany({
      where: { company_id: TENANT, gstin: '27ZZZZZ0000Z1Z5' },
    });
    expect(rows).toHaveLength(1); // no duplicate
    expect(rows[0].email).toBe('changed@imported.test'); // updated
    await cleanupFile();
  });

  it('TO_EXTERNAL sync is honest: counted as "detected", never a fake "created"', async () => {
    await prisma.product_master.create({
      data: { company_id: TENANT, name: 'Local Only Product', code: 'LOP-1', sale_price: 50 },
    });
    const { config, cleanupFile } = await fileConfig('PRODUCT', 'TO_EXTERNAL', 'name,code\n', [
      { internalField: 'name', externalField: 'name', isKey: true },
    ]);
    const job = await SyncService.triggerSync(
      { syncConfigId: config.id, triggeredBy: 'TEST' } as never,
      TENANT,
      'system'
    );
    const finalJob = await waitForSyncJob(job.id);
    expect(finalJob.status).toBe('COMPLETED');

    const summary = finalJob.resultSummary as Record<string, number>;
    expect(summary.created).toBe(0); // nothing was actually created anywhere
    expect(summary.detected).toBeGreaterThanOrEqual(1); // the local product was detected as TO_EXTERNAL
    await cleanupFile();
  });

  it('unknown internal entity → sync job FAILED (no silent empty)', async () => {
    const { config } = await fileConfig('GLROX_WIDGETS', 'FROM_EXTERNAL', 'x\n1\n', []);
    const job = await SyncService.triggerSync(
      { syncConfigId: config.id, triggeredBy: 'TEST' } as never,
      TENANT,
      'system'
    );
    const finalJob = await waitForSyncJob(job.id);
    expect(finalJob.status).toBe('FAILED');
  });
});
