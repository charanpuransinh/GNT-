// ============================================================================
// M14 — Template HTTP + tenant isolation (DB-gated)
//
// पहले यहाँ छेद था: template.controller tenantId को req.query / req.body से लेता था
// (verified token से नहीं), और legacy-alias परत की वजह से update/delete हमेशा
// "not found" पर गिरते थे। यह टेस्ट दोनों को पकड़ता है।
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, registerModules } from '../../../app';
import { prisma } from '@/common/config/prisma';
import { TEST_USER_ID, mintBearer } from '@/tests/helpers/auth';

const COMPANY_ID = '00000000-0000-4000-8000-0000000000a1';
const OTHER_ID = '00000000-0000-4000-8000-0000000000a2';
const auth = () => mintBearer(COMPANY_ID, TEST_USER_ID);
const authOther = () => mintBearer(OTHER_ID, TEST_USER_ID);
const base = '/api/v1/imports/templates';

async function cleanup() {
  await prisma.importMapping.deleteMany({ where: { tenantId: { in: [COMPANY_ID, OTHER_ID] } } });
}

describe.runIf(process.env.TEST_DB === '1')('M14 template HTTP — live DB', () => {
  beforeAll(async () => {
    await registerModules();
    await prisma.company_master.upsert({ where: { id: COMPANY_ID }, update: {}, create: { id: COMPANY_ID, name: 'Tpl Co', code: 'TPLCO1' } });
    await prisma.company_master.upsert({ where: { id: OTHER_ID }, update: {}, create: { id: OTHER_ID, name: 'Tpl Other', code: 'TPLOT1' } });
    await cleanup();
  });

  afterAll(cleanup);

  it('create → get → update → delete roundtrip (update/delete अब सच में चलते हैं)', async () => {
    const created = await request(app).post(base).set('Authorization', auth()).send({
      name: 'Sales invoice map', targetModule: 'sales', targetEntity: 'invoice',
      fileType: 'csv', columnMapping: [{ source: 'Amt', target: 'amount' }],
    });
    expect(created.status).toBe(201);
    const id = created.body.data.id;
    expect(created.body.data.tenantId).toBe(COMPANY_ID);

    const got = await request(app).get(`${base}/${id}`).set('Authorization', auth());
    expect(got.status).toBe(200);
    expect(got.body.data.name).toBe('Sales invoice map');

    const updated = await request(app).put(`${base}/${id}`).set('Authorization', auth()).send({ name: 'Renamed map' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.name).toBe('Renamed map');

    const del = await request(app).delete(`${base}/${id}`).set('Authorization', auth());
    expect(del.status).toBe(200);

    const gone = await request(app).get(`${base}/${id}`).set('Authorization', auth());
    expect(gone.status).toBe(404);
  });

  it('tenant isolation — दूसरी company का template न दिखे, न बदले, न मिटे', async () => {
    const created = await request(app).post(base).set('Authorization', auth()).send({
      name: 'Private map', targetModule: 'purchase', targetEntity: 'bill', fileType: 'csv', columnMapping: [],
    });
    expect(created.status).toBe(201);
    const id = created.body.data.id;

    expect((await request(app).get(`${base}/${id}`).set('Authorization', authOther())).status).toBe(404);
    expect((await request(app).put(`${base}/${id}`).set('Authorization', authOther()).send({ name: 'hijack' })).status).toBe(404);
    expect((await request(app).delete(`${base}/${id}`).set('Authorization', authOther())).status).toBe(404);

    // list भी सिर्फ़ अपनी company का दे — query में tenantId भेजने से कुछ न बदले
    const otherList = await request(app).get(`${base}?tenantId=${COMPANY_ID}`).set('Authorization', authOther());
    expect(otherList.status).toBe(200);
    expect(otherList.body.data.find((t: { id: string }) => t.id === id)).toBeUndefined();

    // असली owner को अब भी दिखे
    const ownList = await request(app).get(base).set('Authorization', auth());
    expect(ownList.body.data.find((t: { id: string }) => t.id === id)).toBeDefined();
  });

  it('default template — नया default पुराने को हटाता है, GET /templates/default सही देता है', async () => {
    const t1 = await request(app).post(base).set('Authorization', auth()).send({
      name: 'D1', targetModule: 'inventory', targetEntity: 'item', fileType: 'csv', columnMapping: [], isDefault: true,
    });
    const t2 = await request(app).post(base).set('Authorization', auth()).send({
      name: 'D2', targetModule: 'inventory', targetEntity: 'item', fileType: 'csv', columnMapping: [], isDefault: true,
    });
    expect(t1.status).toBe(201);
    expect(t2.status).toBe(201);

    const def = await request(app)
      .get(`${base}/default?module=inventory&entityType=item`)
      .set('Authorization', auth());
    expect(def.status).toBe(200);
    expect(def.body.data.id).toBe(t2.body.data.id);
  });
});
