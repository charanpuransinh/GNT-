// M14 — Job service ki jaanch (DB-gated): retention cleanup + tenant scope
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/common/config/prisma';
import { JobService } from './job.service';

const TENANT = '00000000-0000-4000-8000-000000000081';
const OTHER = '00000000-0000-4000-8000-000000000082';

async function cleanup() {
  await prisma.importJob.deleteMany({ where: { tenantId: { in: [TENANT, OTHER] } } });
}

function makeJob(over: Record<string, unknown> = {}) {
  return {
    jobNumber: `IMP-${Math.random().toString(36).slice(2, 12)}`,
    name: 'test', targetModule: 'M06_PARTY', targetEntity: 'CUSTOMER',
    fileName: 'f.csv', fileUrl: 'http://x', fileKey: 'k', fileSize: 10, fileType: 'CSV',
    createdBy: 'u1', tenantId: TENANT, ...over,
  };
}

describe.runIf(process.env.TEST_DB === '1')('M14 job service — live DB', () => {
  beforeAll(cleanup);
  afterAll(cleanup);

  it('cleanupOldJobs: sirf purane terminal jobs delete, pending/recent nahi', async () => {
    const svc = new JobService();

    const oldCompleted = await prisma.importJob.create({ data: makeJob({ status: 'COMPLETED' }) });
    const recentCompleted = await prisma.importJob.create({ data: makeJob({ status: 'COMPLETED' }) });
    const oldPending = await prisma.importJob.create({ data: makeJob({ status: 'PENDING' }) });

    const old = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
    await prisma.importJob.update({ where: { id: oldCompleted.id }, data: { createdAt: old } });
    await prisma.importJob.update({ where: { id: oldPending.id }, data: { createdAt: old } });

    const result = await svc.cleanupOldJobs(TENANT, 30);

    expect(result.deletedImports).toBe(1); // sirf oldCompleted
    expect(await prisma.importJob.findUnique({ where: { id: oldCompleted.id } })).toBeNull();
    expect(await prisma.importJob.findUnique({ where: { id: recentCompleted.id } })).toBeTruthy();
    expect(await prisma.importJob.findUnique({ where: { id: oldPending.id } })).toBeTruthy();
  });

  it('tenant scope: doosre tenant ka purana job nahi chhuta', async () => {
    const svc = new JobService();
    const otherJob = await prisma.importJob.create({ data: makeJob({ tenantId: OTHER, status: 'COMPLETED' }) });
    await prisma.importJob.update({
      where: { id: otherJob.id },
      data: { createdAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000) },
    });

    await svc.cleanupOldJobs(TENANT, 30);
    expect(await prisma.importJob.findUnique({ where: { id: otherJob.id } })).toBeTruthy();
  });
});
