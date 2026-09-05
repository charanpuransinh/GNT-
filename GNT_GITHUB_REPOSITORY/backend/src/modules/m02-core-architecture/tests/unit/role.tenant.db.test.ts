// ============================================================================
// M02 — भूमिका (role): असली database पर जाँच
//
// क्यों चाहिए थी: M02 की मौजूदा दोनों role tests **mock** पर चलती हैं —
// role.service.test.ts repository को mock करती है, और role.controller.test.ts
// पूरी service को। इसलिए दोनों हरी रहीं जबकि असली database पर भूमिका बनाना
// कभी काम ही नहीं करता था:
//
//     roleService.createRole({ ...req.body, companyId })   // camelCase
//     → column का नाम `company_id` है → Prisma runtime पर मना करता है
//
// mock इसे कभी नहीं पकड़ सकता था। इसलिए यह फ़ाइल असली DB पर चलती है।
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { roleService } from '../../services/role.service';
import { TEST_COMPANY_ID } from '@/tests/helpers/auth';

const prisma = new PrismaClient();
const DUSRI_COMPANY_ID = '00000000-0000-4000-8000-0000000002d1';
const stamp = Date.now();
let dusriRoleId: string;
let apniRoleId: string;

describe.runIf(process.env.TEST_DB === '1')('M02 — भूमिका, असली DB पर', () => {
  beforeAll(async () => {
    for (const [id, name, code] of [
      [TEST_COMPANY_ID, 'Test Company', 'TESTCO'],
      [DUSRI_COMPANY_ID, 'Dusri Company', 'M02OTHER'],
    ] as const) {
      await prisma.company_master.upsert({ where: { id }, update: { name }, create: { id, name, code } });
    }

    const dusri = await prisma.role_master.create({
      data: { company_id: DUSRI_COMPANY_ID, name: `DUSRI-ROLE-${stamp}`, description: 'दूसरी company की' },
    });
    dusriRoleId = dusri.id;
  });

  afterAll(async () => {
    // ⚠️ पहले यहाँ पूरी company के role_master rows मिटा देते थे (company_id से) —
    // globalSetup वाली साझा "Owner" भूमिका भी उसी company_id के नीचे है, जिस पर
    // हर test file mintBearer() से चलती है। यानी यह afterAll किसी भी दूसरी parallel
    // चल रही test file की permission तोड़ सकता था (race — file order तय नहीं)।
    // अब सिर्फ़ वही दो roles मिटती हैं जो इसी फ़ाइल ने बनाए।
    await prisma.role_master.deleteMany({ where: { id: { in: [dusriRoleId, apniRoleId].filter(Boolean) } } });
    await prisma.$disconnect();
  });

  it('भूमिका बनाना सच में काम करता है (यही पहले टूटा हुआ था)', async () => {
    const role: any = await roleService.createRole(TEST_COMPANY_ID, {
      name: `APNI-ROLE-${stamp}`,
      description: 'अपनी company की',
    });
    apniRoleId = role.id;

    expect(role.id).toBeTruthy();
    // सबसे ज़रूरी: database में सच में company_id भरा हो
    const dbMein = await prisma.role_master.findUnique({ where: { id: role.id } });
    expect(dbMein?.company_id).toBe(TEST_COMPANY_ID);
    expect(dbMein?.name).toBe(`APNI-ROLE-${stamp}`);
  });

  it('🔒 दूसरी company की भूमिका पढ़ी न जा सके', async () => {
    await expect(roleService.getRoleById(dusriRoleId, TEST_COMPANY_ID)).rejects.toThrow(/not found/i);
  });

  it('🔒 दूसरी company की भूमिका बदली न जा सके — और वो सच में अनछुई रहे', async () => {
    await expect(
      roleService.updateRole(dusriRoleId, TEST_COMPANY_ID, { name: 'छेड़ने की कोशिश' })
    ).rejects.toThrow(/not found/i);

    const baad = await prisma.role_master.findUnique({ where: { id: dusriRoleId } });
    expect(baad?.name).toBe(`DUSRI-ROLE-${stamp}`);
  });

  it('🔒 दूसरी company की भूमिका मिटाई न जा सके — और वो सच में बची रहे', async () => {
    await expect(roleService.deleteRole(dusriRoleId, TEST_COMPANY_ID)).rejects.toThrow(/not found/i);

    const baad = await prisma.role_master.findUnique({ where: { id: dusriRoleId } });
    expect(baad).not.toBeNull();
  });
});
