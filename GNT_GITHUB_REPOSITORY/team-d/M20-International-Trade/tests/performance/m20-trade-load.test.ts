// GNT M20 — Load / Performance Tests
// Validates HSN search and customs-calc validation stay fast under bulk load
// (schema-level throughput; DB/network not involved)

import { describe, it, expect } from 'vitest';
import {
  SearchHSNQuerySchema,
  CustomsCalculateSchema,
  CreateTradeShipmentSchema,
} from '../../backend/src/modules/m20-international-trade/validators/trade.schema';

describe('M20 — Load Tests', () => {
  it('validates 1000 shipment payloads within budget', () => {
    const start = Date.now();
    for (let i = 0; i < 1000; i++) {
      CreateTradeShipmentSchema.safeParse({
        type: i % 2 === 0 ? 'import' : 'export',
        reference_no: `REF-${i}`,
        party_id: 'p1',
        product_id: 'pr1',
        hsn_code: '85171200',
        quantity: i + 1,
      });
    }
    const durationMs = Date.now() - start;
    expect(durationMs).toBeLessThan(1000);
  });

  it('validates 1000 customs-calculate requests within budget', () => {
    const start = Date.now();
    for (let i = 0; i < 1000; i++) {
      CustomsCalculateSchema.safeParse({
        hsn_code: '85171200',
        assessable_value: 1000 + i,
        currency: 'USD',
      });
    }
    const durationMs = Date.now() - start;
    expect(durationMs).toBeLessThan(1000);
  });

  it('validates 500 HSN search queries within budget', () => {
    const start = Date.now();
    for (let i = 0; i < 500; i++) {
      SearchHSNQuerySchema.safeParse({ q: `product-${i}`, limit: 20 });
    }
    const durationMs = Date.now() - start;
    expect(durationMs).toBeLessThan(500);
  });
});
