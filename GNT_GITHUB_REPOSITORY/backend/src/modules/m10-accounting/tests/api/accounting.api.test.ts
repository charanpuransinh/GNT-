// ============================================================================
// M10 — Accounting API tests
//
// 2026-09-04 को पूरी फ़ाइल दोबारा लिखी गई। पुराने tests **सुरक्षा-छेद के भरोसे**
// पास हो रहे थे: वे बिना किसी login के, query string में `?company_id=c1` भेजकर
// लेखा-जोखा माँग लेते थे — और controller वही मान लेता था। छेद बंद करते ही तीनों
// tests 401 देने लगे, यानी वे असल में "काम करता है" नहीं, "छेद खुला है" जाँच रहे थे।
//
// एक test तो नक़ली ही था:
//     it('Unauthorized voucher posting blocked', () => { expect(true).toBe(true) })
// नाम सुरक्षा का, और अंदर कुछ जाँचता ही नहीं। अब वो सच में जाँचता है।
//
// अब ये tests असली app पर चलते हैं (registerModules), असली token के साथ — यानी
// पूरा रास्ता: auth → tenant → route → controller।
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, registerModules } from '../../../../app';
import { prisma } from '@/common/config/prisma';
import { TEST_COMPANY_ID, mintBearer } from '@/tests/helpers/auth';

// दूसरी company — tenant की सीमा जाँचने के लिए
const DUSRI_COMPANY_ID = '00000000-0000-4000-8000-0000000009d1';

describe.runIf(process.env.TEST_DB === '1')('M10 Accounting API', () => {
  beforeAll(async () => {
    await registerModules();
    for (const [id, name, code] of [
      [TEST_COMPANY_ID, 'Test Company', 'TESTCO'],
      // code पर unique constraint है — दूसरे modules के tests भी companies बनाते हैं,
      // इसलिए M10 का अपना अलग code, वरना टकराव होता है
      [DUSRI_COMPANY_ID, 'Dusri Company', 'M10OTHER'],
    ] as const) {
      await prisma.company_master.upsert({
        where: { id },
        update: { name },
        create: { id, name, code },
      });
    }
  });

  afterAll(async () => {
    await prisma.voucher.deleteMany({ where: { company_id: { in: [TEST_COMPANY_ID, DUSRI_COMPANY_ID] } } });
  });

  describe('बुनियादी जाँच', () => {
    it('बिना token कुछ नहीं मिलता', async () => {
      // पहले यह 200 देता था — company query से आती थी, इसलिए login की ज़रूरत ही नहीं पड़ती थी
      const res = await request(app).get('/api/v1/accounting/vouchers');
      expect(res.status).toBe(401);
    });

    it('debit और credit बराबर न हों तो voucher नहीं बनता', async () => {
      const res = await request(app)
        .post('/api/v1/accounting/vouchers')
        .set('Authorization', mintBearer())
        .send({
          voucher_type: 'journal',
          voucher_number: `JV-${Date.now()}`,
          voucher_date: '2024-04-01',
          items: [
            { account_id: 'a1', debit_amount: 100, credit_amount: 0 },
            { account_id: 'a2', debit_amount: 0, credit_amount: 50 },
          ],
        });
      expect(res.status).toBe(400);
    });

    it('अपनी company की vouchers की सूची मिलती है', async () => {
      const res = await request(app)
        .get('/api/v1/accounting/vouchers')
        .set('Authorization', mintBearer());
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('🔒 company की सीमा', () => {
    it('query में दूसरी company की id भेजने से उनका data नहीं मिलता', async () => {
      // यही पुराना छेद था — तब यह चल जाता था
      const res = await request(app)
        .get(`/api/v1/accounting/vouchers?company_id=${DUSRI_COMPANY_ID}`)
        .set('Authorization', mintBearer());

      expect(res.status).toBe(200);
      // company token से तय होती है, query से नहीं — इसलिए दूसरी company का कुछ न आए
      for (const v of res.body) expect(v.company_id).toBe(TEST_COMPANY_ID);
    });

    it('body में दूसरी company की id भेजो तो voucher अपनी ही company में बने', async () => {
      const res = await request(app)
        .post('/api/v1/accounting/vouchers')
        .set('Authorization', mintBearer())
        .send({
          company_id: DUSRI_COMPANY_ID, // जान-बूझकर — इसे अनदेखा होना चाहिए
          voucher_type: 'journal',
          voucher_number: `JV-TENANT-${Date.now()}`,
          voucher_date: '2024-04-01',
          items: [
            { account_id: 'a1', debit_amount: 100, credit_amount: 0 },
            { account_id: 'a2', debit_amount: 0, credit_amount: 100 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.company_id).toBe(TEST_COMPANY_ID);
      expect(res.body.company_id).not.toBe(DUSRI_COMPANY_ID);
    });

    it('दूसरी company की voucher न पढ़ी जा सके', async () => {
      const dusri = await prisma.voucher.create({
        data: {
          company_id: DUSRI_COMPANY_ID,
          voucher_type: 'journal',
          voucher_number: `JV-OTHER-${Date.now()}`,
          voucher_date: new Date('2024-04-01'),
          total_debit: 100,
          total_credit: 100,
        },
      });

      const res = await request(app)
        .get(`/api/v1/accounting/vouchers/${dusri.id}`)
        .set('Authorization', mintBearer());

      // 404 — 403 नहीं, वरना जवाब से पता चल जाता कि वो voucher मौजूद है
      expect(res.status).toBe(404);
    });

    it('दूसरी company की voucher रद्द न की जा सके', async () => {
      // पहले यह बिना किसी जाँच के रद्द कर देता था — सीधे उनके लेखा-जोखा पर असर
      const dusri = await prisma.voucher.create({
        data: {
          company_id: DUSRI_COMPANY_ID,
          voucher_type: 'journal',
          voucher_number: `JV-CANCEL-${Date.now()}`,
          voucher_date: new Date('2024-04-01'),
          total_debit: 50,
          total_credit: 50,
        },
      });

      const res = await request(app)
        .post(`/api/v1/accounting/vouchers/${dusri.id}/cancel`)
        .set('Authorization', mintBearer());

      expect(res.status).toBe(404);

      // और सबसे ज़रूरी: उनकी voucher सच में अनछुई रहे
      const baad = await prisma.voucher.findUnique({ where: { id: dusri.id } });
      expect(baad?.status).not.toBe('cancelled');
    });

    it('दूसरी company की voucher post न की जा सके', async () => {
      const dusri = await prisma.voucher.create({
        data: {
          company_id: DUSRI_COMPANY_ID,
          voucher_type: 'journal',
          voucher_number: `JV-POST-${Date.now()}`,
          voucher_date: new Date('2024-04-01'),
          total_debit: 50,
          total_credit: 50,
        },
      });

      const res = await request(app)
        .post(`/api/v1/accounting/vouchers/${dusri.id}/post`)
        .set('Authorization', mintBearer());

      expect(res.status).toBe(404);

      const baad = await prisma.voucher.findUnique({ where: { id: dusri.id } });
      expect(baad?.status).not.toBe('posted');
    });
  });
});
