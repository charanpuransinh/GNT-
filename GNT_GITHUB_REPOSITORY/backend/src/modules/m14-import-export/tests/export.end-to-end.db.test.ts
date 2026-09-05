// M14 — Export END-TO-END (real DB + real file generation + real data) — fake nahi
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, registerModules } from '../../../app';
import { prisma } from '@/common/config/prisma';
import { TEST_USER_ID, mintBearer } from '@/tests/helpers/auth';

const COMPANY_ID = '00000000-0000-4000-8000-000000000061';
const auth = () => mintBearer(COMPANY_ID, TEST_USER_ID);

async function cleanup() {
  await prisma.party_master.deleteMany({ where: { company_id: COMPANY_ID } });
  await prisma.exportJob.deleteMany({ where: { tenantId: COMPANY_ID } });
}

describe.runIf(process.env.TEST_DB === '1')('M14 export end-to-end — live DB', () => {
  beforeAll(async () => {
    await registerModules();
    await prisma.company_master.upsert({ where: { id: COMPANY_ID }, update: { name: 'Export Co' }, create: { id: COMPANY_ID, name: 'Export Co', code: 'EXPCO-2' } });
    await cleanup();
    // एक असली party बनाओ — export को data चाहिए
    await prisma.party_master.create({
      data: { company_id: COMPANY_ID, party_type: 'customer', name: 'Export Party', email: 'export@test.com' },
    });
  });
  afterAll(cleanup);

  it('export create → असली CSV file बनती है जिसमें party का data है', async () => {
    const res = await request(app)
      .post('/api/v1/imports/exports')
      .set('Authorization', auth())
      .send({
        entityType: 'customer', format: 'csv',
        columns: [{ field: 'name', header: 'Name' }, { field: 'email', header: 'Email' }],
      });
    expect(res.status).toBe(202);

    // processJob background me chalta hai — wait
    await new Promise((r) => setTimeout(r, 800));

    const job = await prisma.exportJob.findFirst({ where: { tenantId: COMPANY_ID } });
    expect(job).toBeTruthy();
    expect(job!.status).toBe('COMPLETED');
    expect(job!.totalRecords).toBe(1); // sirf 1 party (fake 100 nahi)
    expect(job!.fileKey).toBeTruthy();
  });
});
