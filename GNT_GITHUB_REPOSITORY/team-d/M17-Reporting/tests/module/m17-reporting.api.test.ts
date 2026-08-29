/**
 * M17 Reporting — API Tests
 * Owner: D4-DELTA
 */
import { describe, it, expect, vi } from 'vitest';
import { GenerateReportRequestSchema, ExportReportRequestSchema } from '../../backend/src/modules/m17-reporting/validators/report.schema';
import { ReportController } from '../../backend/src/modules/m17-reporting/controllers/report.controller';

describe('M17 Reporting — API Contract Tests', () => {
  describe('POST /api/v1/reports/generate', () => {
    it('should validate correct generate request', () => {
      const validRequest = {
        reportType: 'sales',
        filters: { dateFrom: '2026-08-01T00:00:00Z', dateTo: '2026-08-31T23:59:59Z' },
        format: 'pdf',
      };

      const result = GenerateReportRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject invalid report type', () => {
      const invalidRequest = {
        reportType: 'invalid',
        filters: {},
      };

      const result = GenerateReportRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject invalid GSTIN format', () => {
      const invalidRequest = {
        reportType: 'gst',
        filters: { gstin: 'INVALID' },
      };

      const result = GenerateReportRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });

  describe('POST /api/v1/reports/export', () => {
    it('should validate correct export request', () => {
      const validRequest = {
        reportType: 'sales',
        format: 'pdf',
        data: { rows: [], summary: {} },
      };

      const result = ExportReportRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject unsupported export format', () => {
      const invalidRequest = {
        reportType: 'sales',
        format: 'docx',
        data: {},
      };

      const result = ExportReportRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });

  describe('GET /api/v1/reports/sales', () => {
    it('reads companyId from the x-company-id header and calls generateReport with it', async () => {
      const mockService = {
        generateReport: vi.fn().mockResolvedValue({ success: true, data: { rows: [] } }),
      } as any;
      const controller = new ReportController(mockService);

      const req: any = {
        headers: { 'x-company-id': 'a1b2c3d4-0000-0000-0000-000000000001' },
        query: { dateFrom: '2026-08-01', dateTo: '2026-08-31' },
      };
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      await controller.getSalesReport(req, res, next);

      expect(mockService.generateReport).toHaveBeenCalledWith(
        expect.objectContaining({ reportType: 'sales', format: 'json' }),
        'a1b2c3d4-0000-0000-0000-000000000001'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(next).not.toHaveBeenCalled();
    });

    it('forwards service errors to next() instead of throwing', async () => {
      const mockService = {
        generateReport: vi.fn().mockRejectedValue(new Error('DB unavailable')),
      } as any;
      const controller = new ReportController(mockService);

      const req: any = { headers: {}, query: {} };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      await controller.getSalesReport(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
