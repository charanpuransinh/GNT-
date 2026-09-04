// ============================================================================
// M06 — company की सीमा के tests (live DB पर)
//
// क्यों बने: 2026-09-04 को M06 में एक ख़ास क़िस्म की गड़बड़ी मिली — **दिखावे की जाँच**।
// company की id ली तो जाती थी, पर query में लगती नहीं थी:
//
//     const company_id = requireTenant(req).companyId;          // ← निकाला
//     if (!company_id) return res.status(400)...                // ← जाँचा भी
//     await prisma.batch_master.update({ where: { id }, ... }); // ← और छोड़ दिया
//
// और repository में तो company_id पूरा एक parameter था जिसे body में कभी छुआ ही नहीं गया:
//
//     async update(id, data, company_id) {
//       return prisma.category_master.update({ where: { id }, data });
//     }
//
// यह जाँच न होने से भी ख़तरनाक है — पढ़ने वाला parameter देखकर मान लेता है कि सीमा लगी है।
// tsc कभी नहीं पकड़ता (अनजाना parameter कोई error नहीं), और पुराने tests भी नहीं क्योंकि
// वे सिर्फ़ "अपनी company" वाला रास्ता चलाते थे।
//
// ये tests असली database पर दूसरी company का record बनाकर देखते हैं कि वो सच में अछूता रहे।
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/common/config/prisma';
import { TEST_COMPANY_ID } from '@/tests/helpers/auth';
import { CategoryRepository } from '../../repositories/category.repository';
import { ProductRepository } from '../../repositories/product.repository';

const DUSRI_COMPANY_ID = '00000000-0000-4000-8000-0000000009d6';

const categoryRepo = new CategoryRepository();
const productRepo = new ProductRepository();

describe.runIf(process.env.TEST_DB === '1')('M06 — company की सीमा', () => {
  let dusriCategoryId: string;
  let dusriProductId: string;

  beforeAll(async () => {
    for (const [id, name, code] of [
      [TEST_COMPANY_ID, 'Test Company', 'TESTCO'],
      [DUSRI_COMPANY_ID, 'Dusri Company', 'M06OTHER'],
    ] as const) {
      await prisma.company_master.upsert({ where: { id }, update: { name }, create: { id, name, code } });
    }

    const cat = await prisma.category_master.create({
      data: { company_id: DUSRI_COMPANY_ID, name: `Dusri Category ${Date.now()}` },
    });
    dusriCategoryId = cat.id;

    const prod = await prisma.product_master.create({
      data: {
        company_id: DUSRI_COMPANY_ID,
        name: `Dusri Product ${Date.now()}`,
        unit: 'PCS',
        is_active: true,
      },
    });
    dusriProductId = prod.id;
  });

  afterAll(async () => {
    await prisma.product_master.deleteMany({ where: { company_id: DUSRI_COMPANY_ID } });
    await prisma.category_master.deleteMany({ where: { company_id: DUSRI_COMPANY_ID } });
  });

  it('🔒 दूसरी company की category बदली न जा सके', async () => {
    await expect(
      categoryRepo.update(dusriCategoryId, { name: 'हड़पी हुई' }, TEST_COMPANY_ID),
    ).rejects.toThrow();

    // और सबसे ज़रूरी — उनका नाम सच में अनछुआ रहे
    const baad = await prisma.category_master.findUnique({ where: { id: dusriCategoryId } });
    expect(baad?.name).not.toBe('हड़पी हुई');
  });

  it('🔒 दूसरी company की category मिटाई न जा सके', async () => {
    await expect(categoryRepo.delete(dusriCategoryId, TEST_COMPANY_ID)).rejects.toThrow();

    const baad = await prisma.category_master.findUnique({ where: { id: dusriCategoryId } });
    expect(baad).not.toBeNull();
  });

  it('🔒 दूसरी company का product निष्क्रिय न किया जा सके', async () => {
    await expect(productRepo.softDelete(dusriProductId, TEST_COMPANY_ID)).rejects.toThrow();

    const baad = await prisma.product_master.findUnique({ where: { id: dusriProductId } });
    expect(baad?.is_active).toBe(true);
  });

  it('अपनी company की category सामान्य रूप से बदली जा सके', async () => {
    // सीमा लगाने के चक्कर में सही काम बंद न हो जाए — यह भी जाँचना ज़रूरी है
    const meri = await prisma.category_master.create({
      data: { company_id: TEST_COMPANY_ID, name: `Meri Category ${Date.now()}` },
    });

    const badla = await categoryRepo.update(meri.id, { name: 'नया नाम' }, TEST_COMPANY_ID);
    expect(badla.name).toBe('नया नाम');

    await prisma.category_master.delete({ where: { id: meri.id } });
  });
});
