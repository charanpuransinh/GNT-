/**
 * M20 — Trade document service ki jaanch (nakli prisma se, document content mapping).
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import type { PrismaClient } from '@prisma/client';
import { TradeDocumentService } from '../../services/trade-document.service';

const job = {
  id: 'j1', company_id: 'c1', reference_no: 'EXP-2026-001', type: 'export',
  hsn_code: '84713010', quantity: 2, currency: 'USD', fx_rate: 83.25,
  value_fob: 1000, value_cif: 1100, customs_duty: 50, gst_amount: 90,
};

const makePrisma = (withJob: boolean) => {
  let created: any = null;
  const prisma = {
    trade_job: { findFirst: async () => (withJob ? job : null) },
    trade_document: {
      create: async ({ data }: any) => {
        created = { id: 'd1', company_id: data.company_id, trade_job_id: data.trade_job_id, document_type: data.document_type, content_json: data.content_json, generated_at: new Date(), status: data.status, file_url: null };
        return created;
      },
    },
  } as unknown as PrismaClient;
  return { prisma, getCreated: () => created };
};

test('M20 doc: BOE generate karta hai (Form 24) aur content sahi map hota hai', async () => {
  const { prisma, getCreated } = makePrisma(true);
  const svc = new TradeDocumentService(prisma);
  const d = await svc.generateDocument('c1', { trade_job_id: 'j1', document_type: 'boe' });

  assert.equal(d.document_type, 'boe');
  const content = (getCreated() as any).content_json as Record<string, any>;
  assert.equal(content.document_name, 'Bill of Entry');
  assert.equal(content.form_type, 'Form 24');
  assert.equal(content.reference_no, 'EXP-2026-001');
  assert.equal(content.value_fob, 1000);
});

test('M20 doc: shipping_bill → Form 13, commercial_invoice → Standard', async () => {
  const { prisma } = makePrisma(true);
  const svc = new TradeDocumentService(prisma);
  const sb = await svc.generateDocument('c1', { trade_job_id: 'j1', document_type: 'shipping_bill' });
  assert.equal((sb.content_json as any).form_type, 'Form 13');
});

test('M20 doc: trade job na mile to saaf 404 error', async () => {
  const { prisma } = makePrisma(false);
  const svc = new TradeDocumentService(prisma);
  await assert.rejects(
    () => svc.generateDocument('c1', { trade_job_id: 'jX', document_type: 'boe' }),
    /not found/
  );
});
