// ============================================================================
// M13 ↔ M14 — असली import.completed event se EVENT-trigger rule chalna
//
// पहले M14 sirf internal SSE `progressEmitter` use karta tha — import.completed
// साझा eventBus par kabhi publish hi nahi hota tha, isliye M13 ka import-completed
// rule kabhi nahi chal sakta tha। अब M14 processJob ke अंत में साझा bus par
// `import.completed` publish karta hai — पूरी chain: upload → processJob →
// eventBus → M13 rule → job_execution_log।
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, writeFile, rm } from 'fs/promises';
import os from 'os';
import path from 'path';
import request from 'supertest';
import { app, registerModules } from '../../../app';
import { prisma } from '@/common/config/prisma';
import { TEST_COMPANY_ID, mintBearer } from '@/tests/helpers/auth';

const OTHER_COMPANY_ID = '00000000-0000-4000-8000-0000000014aa';

describe.runIf(process.env.TEST_DB === '1')('M13 ↔ M14 — असली import.completed event', () => {
  let tmpDir: string;
  let ruleId = '';
  let otherRuleId = '';

  beforeAll(async () => {
    await registerModules();
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'm14-wiring-'));
    await prisma.company_master.upsert({ where: { id: TEST_COMPANY_ID }, update: {}, create: { id: TEST_COMPANY_ID, name: 'Test Company', code: 'TESTCO' } });
    await prisma.company_master.upsert({ where: { id: OTHER_COMPANY_ID }, update: {}, create: { id: OTHER_COMPANY_ID, name: 'Other M14', code: 'M14OTHER' } });

    const created = await request(app).post('/api/v1/automation/rules').set('Authorization', mintBearer()).send({
      name: 'Import done alert',
      triggerType: 'EVENT',
      triggerEvent: 'import.completed',
      actions: [{ type: 'LOG', config: { message: 'Import complete: {{entityType}} rows={{totalRows}}' } }],
    });
    ruleId = created.body.data.id;

    const other = await request(app).post('/api/v1/automation/rules').set('Authorization', mintBearer(OTHER_COMPANY_ID)).send({
      name: 'Import done (other company)',
      triggerType: 'EVENT',
      triggerEvent: 'import.completed',
      actions: [{ type: 'LOG', config: { message: 'यह कभी नहीं चलना चाहिए' } }],
    });
    otherRuleId = other.body.data.id;
  }, 60_000);

  afterAll(async () => {
    await prisma.jobExecutionLog.deleteMany({ where: { ruleId: { in: [ruleId, otherRuleId] } } });
    await prisma.automationRule.deleteMany({ where: { id: { in: [ruleId, otherRuleId] } } });
    await prisma.importJob.deleteMany({ where: { tenantId: TEST_COMPANY_ID } });
    await prisma.party_master.deleteMany({ where: { company_id: TEST_COMPANY_ID } });
    await prisma.company_master.deleteMany({ where: { id: OTHER_COMPANY_ID } });
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('M14 import complete hone par M13 ka import.completed rule chal jata hai', async () => {
    const csvFile = path.join(tmpDir, 'parties.csv');
    await writeFile(csvFile, 'name,email,phone\nWire Party,wire@t.com,9876543210\n');

    const res = await request(app)
      .post('/api/v1/imports/imports/upload')
      .set('Authorization', mintBearer())
      .field('entityType', 'customer')
      .attach('file', csvFile);
    expect(res.status).toBe(202);

    let log: Awaited<ReturnType<typeof prisma.jobExecutionLog.findFirst>> = null;
    for (let i = 0; i < 60; i++) {
      log = await prisma.jobExecutionLog.findFirst({ where: { ruleId }, orderBy: { startedAt: 'desc' } });
      if (log && log.status !== 'RUNNING') break;
      await new Promise((r) => setTimeout(r, 200));
    }
    expect(log).not.toBeNull();
    expect(log!.status).toBe('SUCCESS');
    expect(log!.message).toContain('Import complete');

    // दूसरी company ka rule नहीं चला
    const otherLog = await prisma.jobExecutionLog.findFirst({ where: { ruleId: otherRuleId } });
    expect(otherLog).toBeNull();
  });
});
