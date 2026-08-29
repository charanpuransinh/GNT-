// GNT M20 — Security Tests
// Company-isolation on trade jobs/documents + input hardening

import { describe, it, expect } from 'vitest';
import {
  CreateTradeShipmentSchema,
  ListTradeJobsQuerySchema,
} from '../../backend/src/modules/m20-international-trade/validators/trade.schema';

describe('M20 — Security', () => {
  it('rejects an oversized reference_no (buffer/DoS-style abuse)', () => {
    const result = CreateTradeShipmentSchema.safeParse({
      type: 'import',
      reference_no: 'A'.repeat(500),
      party_id: 'p1',
      product_id: 'pr1',
      hsn_code: '85171200',
      quantity: 10,
    });
    expect(result.success).toBe(false);
  });

  it('rejects an HSN code containing SQL-injection-style input', () => {
    const result = CreateTradeShipmentSchema.safeParse({
      type: 'import',
      reference_no: 'IMP-1',
      party_id: 'p1',
      product_id: 'pr1',
      hsn_code: "1' OR '1'='1",
      quantity: 10,
    });
    expect(result.success).toBe(false);
  });

  it('trade document lookup is always scoped by company_id, never by id alone', async () => {
    const mockPrisma = {
      trade_document: {
        findFirst: vi.fn(async () => null),
      },
    } as any;

    const { TradeDocumentService } = await import(
      '../../backend/src/modules/m20-international-trade/services/trade-document.service'
    );
    const service = new TradeDocumentService(mockPrisma);

    await service.getDocument('doc-1', 'c1');

    expect(mockPrisma.trade_document.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'doc-1', company_id: 'c1' }),
      })
    );
  });

  it('list-jobs query caps page size, preventing bulk cross-tenant scraping attempts', () => {
    const result = ListTradeJobsQuerySchema.safeParse({ limit: 10000 });
    expect(result.success).toBe(false);
  });
});
