// ============================================================================
// M07 — company की सीमा (tenant isolation)
//
// इस module में 2026-09-04 तक **एक भी test नहीं था** — tests/unit, tests/api,
// tests/integration तीनों खाली पड़े थे।
//
// जो छेद मिला: updatePO और updateInvoice दोनों `company_id` parameter लेते थे
// और उसे कहीं इस्तेमाल नहीं करते थे —
//
//     await tx.purchase_order_item.deleteMany({ where: { purchase_order_id: id } });
//     return tx.purchase_order.update({ where: { id }, ... });   // company_id गायब
//
// यानी दूसरी company के PO की id भेजते ही उसकी सारी lines पहले ही मिट जातीं,
// फिर उसका PO भी बदल जाता। नुक़सान update से पहले ही हो चुका होता था।
//
// इसलिए ये tests सिर्फ़ "error आया" नहीं देखतीं — ये देखती हैं कि दूसरी company
// की rows **सच में अनछुई** रहीं।
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PurchaseOrderRepository } from '../../repositories/po.repository';
import { PurchaseRepository } from '../../repositories/purchase.repository';
import { TEST_COMPANY_ID } from '@/tests/helpers/auth';

const prisma = new PrismaClient();
const poRepo = new PurchaseOrderRepository(prisma);
const invRepo = new PurchaseRepository(prisma);

const DUSRI_COMPANY_ID = '00000000-0000-4000-8000-0000000007d1';
const BRANCH_ID = '00000000-0000-4000-8000-0000000007d2';
const SUPPLIER_ID = '00000000-0000-4000-8000-0000000007d3';
const PRODUCT_ID = '00000000-0000-4000-8000-0000000007d4';

let dusriPoId: string;
let dusriInvoiceId: string;
const stamp = Date.now();

describe.runIf(process.env.TEST_DB === '1')('M07 — company की सीमा', () => {
  beforeAll(async () => {
    for (const [id, name, code] of [
      [TEST_COMPANY_ID, 'Test Company', 'TESTCO'],
      // code unique है — M07 अपना अलग code रखे, वरना दूसरे modules की tests से टकराव
      [DUSRI_COMPANY_ID, 'Dusri Company', 'M07OTHER'],
    ] as const) {
      await prisma.company_master.upsert({ where: { id }, update: { name }, create: { id, name, code } });
    }

    const dusriPo = await prisma.purchase_order.create({
      data: {
        company_id: DUSRI_COMPANY_ID,
        branch_id: BRANCH_ID,
        supplier_id: SUPPLIER_ID,
        po_number: `PO-OTHER-${stamp}`,
        po_date: new Date('2024-04-01'),
        items: { create: [{ product_id: PRODUCT_ID, quantity: 10, rate: 100 }] },
      },
    });
    dusriPoId = dusriPo.id;

    const dusriInvoice = await prisma.purchase_invoice.create({
      data: {
        company_id: DUSRI_COMPANY_ID,
        branch_id: BRANCH_ID,
        supplier_id: SUPPLIER_ID,
        invoice_number: `PI-OTHER-${stamp}`,
        invoice_date: new Date('2024-04-01'),
        items: { create: [{ product_id: PRODUCT_ID, quantity: 5, rate: 200 }] },
      },
    });
    dusriInvoiceId = dusriInvoice.id;
  });

  afterAll(async () => {
    await prisma.purchase_invoice.deleteMany({ where: { company_id: { in: [TEST_COMPANY_ID, DUSRI_COMPANY_ID] } } });
    await prisma.purchase_order.deleteMany({ where: { company_id: { in: [TEST_COMPANY_ID, DUSRI_COMPANY_ID] } } });
    await prisma.$disconnect();
  });

  it('🔒 दूसरी company का PO बदला न जा सके', async () => {
    await expect(
      poRepo.updatePO(dusriPoId, TEST_COMPANY_ID, { notes: 'छेड़ने की कोशिश' } as any)
    ).rejects.toThrow(/not found/i);

    const baad = await prisma.purchase_order.findUnique({ where: { id: dusriPoId } });
    expect(baad?.notes).toBeNull();
    expect(baad?.company_id).toBe(DUSRI_COMPANY_ID);
  });

  it('🔒 नाकाम कोशिश में दूसरी company के PO की lines न मिटें', async () => {
    // असली ख़तरा यही था — items update से *पहले* मिटते थे
    await expect(
      poRepo.updatePO(dusriPoId, TEST_COMPANY_ID, {
        notes: 'x',
        items: [{ product_id: PRODUCT_ID, quantity: 1, rate: 1 }],
      } as any)
    ).rejects.toThrow(/not found/i);

    const lines = await prisma.purchase_order_item.count({ where: { purchase_order_id: dusriPoId } });
    expect(lines).toBe(1);
  });

  it('🔒 दूसरी company का purchase invoice बदला न जा सके', async () => {
    await expect(
      invRepo.updateInvoice(dusriInvoiceId, TEST_COMPANY_ID, { notes: 'छेड़ने की कोशिश' } as any)
    ).rejects.toThrow(/not found/i);

    const baad = await prisma.purchase_invoice.findUnique({ where: { id: dusriInvoiceId } });
    expect(baad?.company_id).toBe(DUSRI_COMPANY_ID);
  });

  it('🔒 नाकाम कोशिश में दूसरी company के invoice की lines न मिटें', async () => {
    await expect(
      invRepo.updateInvoice(dusriInvoiceId, TEST_COMPANY_ID, {
        notes: 'x',
        items: [{ product_id: PRODUCT_ID, quantity: 1, rate: 1 }],
      } as any)
    ).rejects.toThrow(/not found/i);

    const lines = await prisma.purchase_invoice_item.count({ where: { purchase_invoice_id: dusriInvoiceId } });
    expect(lines).toBe(1);
  });

  it('अपनी company का PO सामान्य रूप से बदल जाए (fix ने असली काम नहीं तोड़ा)', async () => {
    const apna = await prisma.purchase_order.create({
      data: {
        company_id: TEST_COMPANY_ID,
        branch_id: BRANCH_ID,
        supplier_id: SUPPLIER_ID,
        po_number: `PO-MINE-${stamp}`,
        po_date: new Date('2024-04-01'),
        items: { create: [{ product_id: PRODUCT_ID, quantity: 2, rate: 50 }] },
      },
    });

    const updated = await poRepo.updatePO(apna.id, TEST_COMPANY_ID, { notes: 'अपना PO' } as any);
    expect(updated.notes).toBe('अपना PO');
  });
});
