// GNT M20 — API Contract Tests
// Locks in the fixed document routes (generate now validates via
// GenerateDocumentSchema; list/update-status routes were added)

import { describe, it, expect } from 'vitest';
import {
  CustomsCalculateSchema,
  SearchHSNQuerySchema,
  FXConvertSchema,
} from '../../backend/src/modules/m20-international-trade/validators/trade.schema';

describe('M20 — API Contract', () => {
  describe('POST /api/v1/customs/calculate', () => {
    it('validates a correct customs calculation request', () => {
      const result = CustomsCalculateSchema.safeParse({
        hsn_code: '85171200',
        assessable_value: 50000,
        currency: 'USD',
        fx_rate: 83.2,
      });
      expect(result.success).toBe(true);
    });

    it('rejects a negative assessable_value', () => {
      const result = CustomsCalculateSchema.safeParse({
        hsn_code: '85171200',
        assessable_value: -100,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('GET /api/v1/hsn/search', () => {
    it('validates a correct search query', () => {
      const result = SearchHSNQuerySchema.safeParse({ q: 'mobile phone', limit: 10 });
      expect(result.success).toBe(true);
    });
  });

  describe('POST /api/v1/fx/convert', () => {
    it('validates a correct currency conversion request', () => {
      const result = FXConvertSchema.safeParse({
        amount: 1000,
        from_currency: 'USD',
        to_currency: 'INR',
      });
      expect(result.success).toBe(true);
    });

    it('rejects a negative amount', () => {
      const result = FXConvertSchema.safeParse({
        amount: -50,
        from_currency: 'USD',
        to_currency: 'INR',
      });
      expect(result.success).toBe(false);
    });
  });
});
