// GNT M20 — Integration Tests
// Exercises TradeDocumentService end-to-end against a mocked Prisma client

import { describe, it, expect, vi, beforeEach } from 'vitest';

const tradeJobs = new Map<string, any>();
const documents = new Map<string, any>();
let docCounter = 0;

const mockPrisma = {
  trade_document: {
    create: vi.fn(async ({ data }: any) => {
      docCounter++;
      const doc = { id: `doc-${docCounter}`, created_at: new Date(), trade_job: undefined, ...data };
      documents.set(doc.id, doc);
      return doc;
    }),
    findFirst: vi.fn(async ({ where }: any) => {
      const doc = documents.get(where.id);
      if (!doc || doc.company_id !== where.company_id) return null;
      return { ...doc, trade_job: tradeJobs.get(doc.trade_job_id) };
    }),
    findMany: vi.fn(async ({ where }: any) =>
      [...documents.values()].filter(
        (d) => d.trade_job_id === where.trade_job_id && d.company_id === where.company_id
      )
    ),
    update: vi.fn(async ({ where, data }: any) => {
      const doc = documents.get(where.id);
      const updated = { ...doc, ...data };
      documents.set(where.id, updated);
      return updated;
    }),
  },
} as any;

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrisma),
  DocumentType: {},
  DocumentStatus: {},
}));

import { TradeDocumentService } from '../../backend/src/modules/m20-international-trade/services/trade-document.service';
import { TradeRepository } from '../../backend/src/modules/m20-international-trade/repositories/trade.repository';

vi.mock('../../backend/src/modules/m20-international-trade/repositories/trade.repository', () => ({
  TradeRepository: vi.fn().mockImplementation(() => ({
    findById: vi.fn(async (id: string, companyId: string) => {
      const job = tradeJobs.get(id);
      return job && job.company_id === companyId ? job : null;
    }),
  })),
}));

describe('M20 — Trade Document Integration', () => {
  let service: TradeDocumentService;

  beforeEach(() => {
    documents.clear();
    tradeJobs.clear();
    docCounter = 0;
    tradeJobs.set('job-1', {
      id: 'job-1',
      company_id: 'c1',
      reference_no: 'IMP-2026-001',
      type: 'import',
      hsn_code: '85171200',
      quantity: 100,
      currency: 'USD',
      fx_rate: 83.2,
      value_fob: 1000,
      value_cif: 1100,
      customs_duty: 150,
      gst_amount: 200,
    });
    service = new TradeDocumentService(mockPrisma);
  });

  it('generates a Bill of Entry document for an existing trade job', async () => {
    const doc = await service.generateDocument('c1', {
      trade_job_id: 'job-1',
      document_type: 'boe',
      metadata: { port_code: 'INBOM1' },
    } as any);

    expect(doc.document_type).toBe('boe');
    expect(doc.status).toBe('generated');
  });

  it('throws NOT_FOUND when trade job does not belong to the company', async () => {
    await expect(
      service.generateDocument('wrong-company', {
        trade_job_id: 'job-1',
        document_type: 'boe',
      } as any)
    ).rejects.toThrow();
  });

  it('full flow: generate -> list by trade job -> update status', async () => {
    const doc = await service.generateDocument('c1', {
      trade_job_id: 'job-1',
      document_type: 'commercial_invoice',
    } as any);

    const list = await service.listDocuments('job-1', 'c1');
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(doc.id);

    const updated = await service.updateDocumentStatus(doc.id, 'c1', 'approved' as any);
    expect(updated.status).toBe('approved');
  });
});
