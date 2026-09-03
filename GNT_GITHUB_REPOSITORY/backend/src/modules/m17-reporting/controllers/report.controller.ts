/**
 * M17 Reporting — Report CRUD Handlers
 * Owner: D4-DELTA
 */
import { Request, Response, NextFunction } from 'express';
import { requireTenant } from '@/common/middleware/require-tenant';
import { ReportService } from '../services/report.service';
import {
  GenerateReportRequestSchema,
  ExportReportRequestSchema,
  ReportConfigSchema,
  ReportTemplateSchema,
} from '../validators/report.schema';
import { ZodError } from 'zod';

export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  // ─── Report Generation ───

  generateReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = requireTenant(req).companyId as string;
      if (!companyId) {
        res.status(400).json({ success: false, error: 'Company ID required' });
        return;
      }

      const parsed = GenerateReportRequestSchema.parse(req.body);
      const result = await this.reportService.generateReport(parsed, companyId);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ success: false, error: error.issues });
        return;
      }
      next(error);
    }
  };

  getSalesReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = requireTenant(req).companyId as string;
      const filters = {
        dateFrom: req.query.dateFrom as string | undefined,
        dateTo: req.query.dateTo as string | undefined,
        productId: req.query.productId as string | undefined,
        customerId: req.query.customerId as string | undefined,
      };
      const result = await this.reportService.generateReport(
        { reportType: 'sales', filters, format: 'json' },
        companyId
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getPurchaseReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = requireTenant(req).companyId as string;
      const filters = {
        dateFrom: req.query.dateFrom as string | undefined,
        dateTo: req.query.dateTo as string | undefined,
        supplierId: req.query.supplierId as string | undefined,
        poStatus: req.query.poStatus as string | undefined,
      };
      const result = await this.reportService.generateReport(
        { reportType: 'purchase', filters, format: 'json' },
        companyId
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getInventoryReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = requireTenant(req).companyId as string;
      const filters = {
        warehouseId: req.query.warehouseId as string | undefined,
        productId: req.query.productId as string | undefined,
        categoryId: req.query.categoryId as string | undefined,
        stockStatus: req.query.stockStatus as string | undefined,
      };
      const result = await this.reportService.generateReport(
        { reportType: 'inventory', filters, format: 'json' },
        companyId
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getGSTReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = requireTenant(req).companyId as string;
      const filters = {
        dateFrom: req.query.dateFrom as string | undefined,
        dateTo: req.query.dateTo as string | undefined,
        gstin: req.query.gstin as string | undefined,
        taxRate: req.query.taxRate ? Number(req.query.taxRate) : undefined,
        hsnCode: req.query.hsnCode as string | undefined,
      };
      const result = await this.reportService.generateReport(
        { reportType: 'gst', filters, format: 'json' },
        companyId
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getAccountingReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = requireTenant(req).companyId as string;
      const filters = {
        dateFrom: req.query.dateFrom as string | undefined,
        dateTo: req.query.dateTo as string | undefined,
        ledgerId: req.query.ledgerId as string | undefined,
        voucherType: req.query.voucherType as string | undefined,
      };
      const result = await this.reportService.generateReport(
        { reportType: 'accounting', filters, format: 'json' },
        companyId
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getHRReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = requireTenant(req).companyId as string;
      const filters = {
        dateFrom: req.query.dateFrom as string | undefined,
        dateTo: req.query.dateTo as string | undefined,
        departmentId: req.query.departmentId as string | undefined,
        employeeId: req.query.employeeId as string | undefined,
        month: req.query.month as string | undefined,
        year: req.query.year ? Number(req.query.year) : undefined,
      };
      const result = await this.reportService.generateReport(
        { reportType: 'hr', filters, format: 'json' },
        companyId
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  exportReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = requireTenant(req).companyId as string;
      const baseUrl = `${req.protocol}://${req.get('host')}`;

      const parsed = ExportReportRequestSchema.parse(req.body);
      const result = await this.reportService.exportReport(parsed, companyId, baseUrl);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ success: false, error: error.issues });
        return;
      }
      next(error);
    }
  };

  getExecutiveDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = requireTenant(req).companyId as string;
      const result = await this.reportService.getExecutiveDashboard(companyId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  // ─── Report Config CRUD ───

  createConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = requireTenant(req).companyId as string;
      const userId = req.headers['x-user-id'] as string;
      const parsed = ReportConfigSchema.parse(req.body);
      const result = await this.reportService.createReportConfig(parsed, userId);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ success: false, error: error.issues });
        return;
      }
      next(error);
    }
  };

  getConfigs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = requireTenant(req).companyId as string;
      const configs = await this.reportService.getReportConfigs(companyId);
      res.status(200).json({ success: true, data: configs });
    } catch (error) {
      next(error);
    }
  };

  updateConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = requireTenant(req).companyId as string;
      const id = String(req.params.id);
      const result = await this.reportService.updateReportConfig(id, companyId, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  deleteConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = requireTenant(req).companyId as string;
      const id = String(req.params.id);
      await this.reportService.deleteReportConfig(id, companyId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  // ─── Report Template CRUD ───

  createTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = requireTenant(req).companyId as string;
      const userId = req.headers['x-user-id'] as string;
      const parsed = ReportTemplateSchema.parse(req.body);
      const result = await this.reportService.createReportTemplate(parsed, userId);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ success: false, error: error.issues });
        return;
      }
      next(error);
    }
  };

  getTemplates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = requireTenant(req).companyId as string;
      const templates = await this.reportService.getReportTemplates(companyId);
      res.status(200).json({ success: true, data: templates });
    } catch (error) {
      next(error);
    }
  };

  updateTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = requireTenant(req).companyId as string;
      const id = String(req.params.id);
      const result = await this.reportService.updateReportTemplate(id, companyId, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  deleteTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = requireTenant(req).companyId as string;
      const id = String(req.params.id);
      await this.reportService.deleteReportTemplate(id, companyId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
