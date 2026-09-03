// M11 Payment Module - Invoice Controller

import { Request, Response, NextFunction } from 'express';
import { InvoiceService } from '../services/invoice.service';
import { InvoiceFilter, CreateInvoiceDto, UpdateInvoiceDto } from '../types';
import { successResponse, errorResponse, createdResponse, buildPaginationMeta } from '../utils/response.helper';

export class InvoiceController {
  constructor(private service: InvoiceService) {}

  getInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const tenantId = String(req.tenantId ?? '');
      const invoice = await this.service.getInvoice(id, tenantId);
      successResponse(res, invoice);
    } catch (err) { next(err); }
  };

  getInvoiceByNumber = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const number = String(req.params.number);
      const tenantId = String(req.tenantId ?? '');
      const invoice = await this.service.getInvoiceByNumber(number, tenantId);
      successResponse(res, invoice);
    } catch (err) { next(err); }
  };

  listInvoices = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = String(req.tenantId ?? '');
      const filter: InvoiceFilter = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
        search: req.query.search as string,
        status: req.query.status as any,
        customerId: req.query.customerId as string,
        minAmount: req.query.minAmount as string,
        maxAmount: req.query.maxAmount as string,
        isOverdue: req.query.isOverdue === 'true',
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };
      const { data, total } = await this.service.listInvoices(filter, tenantId);
      successResponse(res, data, 200, buildPaginationMeta(filter.page || 1, filter.limit || 20, total));
    } catch (err) { next(err); }
  };

  createInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = String(req.tenantId ?? '');
      const userId = String(req.userId ?? '');
      const dto: CreateInvoiceDto = req.body;
      const invoice = await this.service.createInvoice(dto, tenantId, userId);
      createdResponse(res, invoice);
    } catch (err) { next(err); }
  };

  updateInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const tenantId = String(req.tenantId ?? '');
      const userId = String(req.userId ?? '');
      const dto: UpdateInvoiceDto = req.body;
      const invoice = await this.service.updateInvoice(id, dto, tenantId, userId);
      successResponse(res, invoice);
    } catch (err) { next(err); }
  };

  sendInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const tenantId = String(req.tenantId ?? '');
      const userId = String(req.userId ?? '');
      const invoice = await this.service.sendInvoice(id, tenantId, userId);
      successResponse(res, invoice);
    } catch (err) { next(err); }
  };

  cancelInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const tenantId = String(req.tenantId ?? '');
      const userId = String(req.userId ?? '');
      const invoice = await this.service.cancelInvoice(id, tenantId, userId);
      successResponse(res, invoice);
    } catch (err) { next(err); }
  };

  deleteInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const tenantId = String(req.tenantId ?? '');
      await this.service.deleteInvoice(id, tenantId);
      successResponse(res, { deleted: true });
    } catch (err) { next(err); }
  };

  getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = String(req.tenantId ?? '');
      const stats = await this.service.getDashboardStats(tenantId);
      successResponse(res, stats);
    } catch (err) { next(err); }
  };

  getOverdueInvoices = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = String(req.tenantId ?? '');
      const { data, total } = await this.service.getOverdueInvoices(tenantId);
      successResponse(res, data, 200, buildPaginationMeta(1, 100, total));
    } catch (err) { next(err); }
  };
}
