// GNT M20 — Unit Tests
// Validates the Zod schemas that gate every trade/HSN/document endpoint

import { describe, it, expect } from 'vitest';
import {
  CreateTradeShipmentSchema,
  UpdateTradeShipmentSchema,
  ListTradeJobsQuerySchema,
  HSNValidationSchema,
} from '../../backend/src/modules/m20-international-trade/validators/trade.schema';
import { GenerateDocumentSchema } from '../../backend/src/modules/m20-international-trade/validators/trade.schema';

describe('M20 — Validators', () => {
  describe('CreateTradeShipmentSchema', () => {
    it('accepts a valid import shipment payload', () => {
      const result = CreateTradeShipmentSchema.safeParse({
        type: 'import',
        reference_no: 'IMP-2026-001',
        party_id: 'p1',
        product_id: 'pr1',
        hsn_code: '85171200',
        quantity: 100,
        currency: 'USD',
      });
      expect(result.success).toBe(true);
    });

    it('rejects an HSN code that is not exactly 8 digits', () => {
      const result = CreateTradeShipmentSchema.safeParse({
        type: 'export',
        reference_no: 'EXP-2026-001',
        party_id: 'p1',
        product_id: 'pr1',
        hsn_code: '851712', // only 6 digits
        quantity: 50,
      });
      expect(result.success).toBe(false);
    });

    it('rejects a negative quantity', () => {
      const result = CreateTradeShipmentSchema.safeParse({
        type: 'import',
        reference_no: 'IMP-2026-002',
        party_id: 'p1',
        product_id: 'pr1',
        hsn_code: '85171200',
        quantity: -5,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateTradeShipmentSchema', () => {
    it('allows a partial update with only status', () => {
      const result = UpdateTradeShipmentSchema.safeParse({ status: 'customs_cleared' });
      expect(result.success).toBe(true);
    });
  });

  describe('ListTradeJobsQuerySchema', () => {
    it('defaults page and limit when omitted', () => {
      const result = ListTradeJobsQuerySchema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('caps limit at 100', () => {
      const result = ListTradeJobsQuerySchema.safeParse({ limit: 500 });
      expect(result.success).toBe(false);
    });
  });

  describe('HSNValidationSchema', () => {
    it('rejects a code with letters', () => {
      const result = HSNValidationSchema.safeParse({ code: '8517AB12', product_description: 'Router' });
      expect(result.success).toBe(false);
    });
  });

  describe('GenerateDocumentSchema (now enforced on the route — previously unvalidated)', () => {
    it('accepts a valid boe generation request', () => {
      const result = GenerateDocumentSchema.safeParse({
        trade_job_id: 'a1b2c3d4-0000-0000-0000-000000000001',
        document_type: 'boe',
        metadata: { port_code: 'INBOM1' },
      });
      expect(result.success).toBe(true);
    });

    it('rejects an unknown document_type', () => {
      const result = GenerateDocumentSchema.safeParse({
        trade_job_id: 'a1b2c3d4-0000-0000-0000-000000000001',
        document_type: 'bill_of_lading', // not in DocumentTypeEnum
      });
      expect(result.success).toBe(false);
    });
  });
});
