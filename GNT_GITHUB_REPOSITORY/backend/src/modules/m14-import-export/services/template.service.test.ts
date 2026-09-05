// M14 — Template service ki jaanch (DB-gated): default template sirf ek
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/common/config/prisma';
import { TemplateService } from './template.service';

const TENANT = '00000000-0000-4000-8000-000000000080';

async function cleanup() {
  await prisma.importMapping.deleteMany({ where: { tenantId: TENANT } });
}

describe.runIf(process.env.TEST_DB === '1')('M14 template service — live DB', () => {
  beforeAll(cleanup);
  afterAll(cleanup);

  it('default template sirf ek hi rehta hai — naya default purane ko reset karta hai', async () => {
    const svc = new TemplateService();

    await svc.createTemplate({
      tenantId: TENANT, name: 'T1', targetModule: 'sales', targetEntity: 'invoice',
      fileType: 'csv', columnMapping: [], isDefault: true, userId: 'u1',
    });
    const t2 = await svc.createTemplate({
      tenantId: TENANT, name: 'T2', targetModule: 'sales', targetEntity: 'invoice',
      fileType: 'csv', columnMapping: [], isDefault: true, userId: 'u1',
    });

    const defaults = await prisma.importMapping.findMany({
      where: { tenantId: TENANT, targetModule: 'sales', targetEntity: 'invoice', isDefault: true },
    });
    expect(defaults.length).toBe(1);
    expect(defaults[0].id).toBe(t2.id);
  });

  it('template tenant-scope se hi milta hai (doosra tenant nahi)', async () => {
    const svc = new TemplateService();
    const t = await svc.createTemplate({
      tenantId: TENANT, name: 'T3', targetModule: 'sales', targetEntity: 'invoice',
      fileType: 'csv', columnMapping: [], userId: 'u1',
    });

    await expect(svc.getTemplateById(t.id, 'other-tenant')).rejects.toThrow(/not found/);
    const found = await svc.getTemplateById(t.id, TENANT);
    expect(found.id).toBe(t.id);
  });
});
