// M14 — Import END-TO-END (real DB + real file upload + real insert) — fake success nahi
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { mkdtemp, writeFile, rm } from 'fs/promises';
import os from 'os';
import path from 'path';
import { app, registerModules } from '../../../app';
import { prisma } from '@/common/config/prisma';
import { TEST_USER_ID, mintBearer } from '@/tests/helpers/auth';

const COMPANY_ID = '00000000-0000-4000-8000-000000000060';
const auth = () => mintBearer(COMPANY_ID, TEST_USER_ID);

async function cleanup() {
  await prisma.party_master.deleteMany({ where: { company_id: COMPANY_ID } });
  await prisma.importJob.deleteMany({ where: { tenantId: COMPANY_ID } });
}

/** background processJob fire-and-forget hai — fixed sleep flaky tha; ab naye job ke terminal status ka poll */
const TERMINAL = ['COMPLETED', 'FAILED', 'PARTIAL', 'PARTIALLY_COMPLETED'];
async function latestImportJobId(): Promise<string | null> {
  const j = await prisma.importJob.findFirst({ where: { tenantId: COMPANY_ID }, orderBy: { createdAt: 'desc' } });
  return j?.id ?? null;
}
async function waitForImportJobAfter(prevId: string | null, maxMs = 15000): Promise<void> {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    const job = await prisma.importJob.findFirst({ where: { tenantId: COMPANY_ID }, orderBy: { createdAt: 'desc' } });
    if (job && job.id !== prevId && TERMINAL.includes(job.status)) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('import job did not reach a terminal state in time');
}

describe.runIf(process.env.TEST_DB === '1')('M14 import end-to-end — live DB', () => {
  let tmpDir: string;

  beforeAll(async () => {
    await registerModules();
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'm14-e2e-'));
    await prisma.company_master.upsert({ where: { id: COMPANY_ID }, update: { name: 'Import Co' }, create: { id: COMPANY_ID, name: 'Import Co', code: 'IMPCO' } });
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('CSV upload → party असल में insert होती है (end-to-end, fake nahi)', async () => {
    const csvFile = path.join(tmpDir, 'parties.csv');
    await writeFile(csvFile, 'name,email,phone\nAcme Import,acme@test.com,9876543210\n');

    const prevId = await latestImportJobId();
    const res = await request(app)
      .post('/api/v1/imports/imports/upload')
      .set('Authorization', auth())
      .field('entityType', 'customer')
      .attach('file', csvFile);
    expect(res.status).toBe(202);

    // processJob background me chalta hai — naye job ke terminal hone ka wait
    await waitForImportJobAfter(prevId);

    const party = await prisma.party_master.findFirst({ where: { company_id: COMPANY_ID, name: 'Acme Import' } });
    expect(party).toBeTruthy();
    expect(party!.email).toBe('acme@test.com');
  });

  it('duplicate CSV dobara upload → skip (nayi row nahi, skippedRows badhta hai)', async () => {
    const csvFile = path.join(tmpDir, 'parties-dup.csv');
    await writeFile(csvFile, 'name,email,phone\nAcme Import,acme@test.com,9876543210\n');

    const before = await prisma.party_master.count({ where: { company_id: COMPANY_ID, name: 'Acme Import' } });

    const prevId = await latestImportJobId();
    const res = await request(app)
      .post('/api/v1/imports/imports/upload')
      .set('Authorization', auth())
      .field('entityType', 'customer')
      .attach('file', csvFile);
    expect(res.status).toBe(202);

    await waitForImportJobAfter(prevId);

    const after = await prisma.party_master.count({ where: { company_id: COMPANY_ID, name: 'Acme Import' } });
    expect(after).toBe(before); // duplicate skip — naya insert nahi hua

    const jobs = await prisma.importJob.findMany({ where: { tenantId: COMPANY_ID }, orderBy: { createdAt: 'desc' }, take: 1 });
    expect(jobs[0].skippedRows).toBeGreaterThanOrEqual(1);
  });
});
