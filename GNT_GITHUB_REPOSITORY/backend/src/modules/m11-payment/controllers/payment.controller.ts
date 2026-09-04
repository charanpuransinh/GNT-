// M11 Payment Module - Payment Transaction Controller
// (tenant/user पहचान सिर्फ़ verified token से — req.tenant / req.user, header नहीं)

import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service';
import { PaymentFilter, CreatePaymentDto, UpdatePaymentDto, PaymentStatus, TransactionType } from '../types';
import { successResponse, createdResponse, buildPaginationMeta } from '../utils/response.helper';

export class PaymentController {
  constructor(private service: PaymentService) {}

  getPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const tenantId = req.tenant?.companyId ?? '';
      const payment = await this.service.getPayment(id, tenantId);
      successResponse(res, payment);
    } catch (err) { next(err); }
  };

  listPayments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenant?.companyId ?? '';
      const filter: PaymentFilter = {
        page: req.query.page ? parseInt(String(req.query.page)) : 1,
        limit: req.query.limit ? parseInt(String(req.query.limit)) : 20,
        sortBy: req.query.sortBy ? String(req.query.sortBy) : undefined,
        sortOrder: req.query.sortOrder === 'asc' ? 'asc' : 'desc',
        search: req.query.search ? String(req.query.search) : undefined,
        status: typeof req.query.status === 'string' ? req.query.status as PaymentStatus : undefined,
        type: typeof req.query.type === 'string' ? req.query.type as TransactionType : undefined,
        paymentMethodId: req.query.paymentMethodId ? String(req.query.paymentMethodId) : undefined,
        invoiceId: req.query.invoiceId ? String(req.query.invoiceId) : undefined,
        payerId: req.query.payerId ? String(req.query.payerId) : undefined,
        minAmount: req.query.minAmount ? String(req.query.minAmount) : undefined,
        maxAmount: req.query.maxAmount ? String(req.query.maxAmount) : undefined,
        startDate: req.query.startDate ? new Date(String(req.query.startDate)) : undefined,
        endDate: req.query.endDate ? new Date(String(req.query.endDate)) : undefined,
      };
      const { data, total } = await this.service.listPayments(filter, tenantId);
      successResponse(res, data, 200, buildPaginationMeta(filter.page || 1, filter.limit || 20, total));
    } catch (err) { next(err); }
  };

  createPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenant?.companyId ?? '';
      const userId = req.user?.id ?? '';
      const dto: CreatePaymentDto = req.body;
      const payment = await this.service.createPayment(dto, tenantId, userId);
      createdResponse(res, payment);
    } catch (err) { next(err); }
  };

  processPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const tenantId = req.tenant?.companyId ?? '';
      const userId = req.user?.id ?? '';
      const { gatewayRef, gatewayResponse } = req.body;
      const payment = await this.service.processPayment(id, tenantId, userId, gatewayRef, gatewayResponse);
      successResponse(res, payment);
    } catch (err) { next(err); }
  };

  failPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const tenantId = req.tenant?.companyId ?? '';
      const userId = req.user?.id ?? '';
      const { reason } = req.body;
      const payment = await this.service.failPayment(id, tenantId, userId, reason);
      successResponse(res, payment);
    } catch (err) { next(err); }
  };

  cancelPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const tenantId = req.tenant?.companyId ?? '';
      const userId = req.user?.id ?? '';
      const payment = await this.service.cancelPayment(id, tenantId, userId);
      successResponse(res, payment);
    } catch (err) { next(err); }
  };

  updatePayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const tenantId = req.tenant?.companyId ?? '';
      const userId = req.user?.id ?? '';
      const dto: UpdatePaymentDto = req.body;
      const payment = await this.service.updatePayment(id, dto, tenantId, userId);
      successResponse(res, payment);
    } catch (err) { next(err); }
  };

  deletePayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const tenantId = req.tenant?.companyId ?? '';
      await this.service.deletePayment(id, tenantId);
      successResponse(res, { deleted: true });
    } catch (err) { next(err); }
  };

  getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenant?.companyId ?? '';
      const startDate = req.query.startDate ? new Date(String(req.query.startDate)) : undefined;
      const endDate = req.query.endDate ? new Date(String(req.query.endDate)) : undefined;
      const stats = await this.service.getDashboardStats(tenantId, startDate, endDate);
      successResponse(res, stats);
    } catch (err) { next(err); }
  };
}
