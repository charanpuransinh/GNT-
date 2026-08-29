// M11 Payment Module - Payment Transaction Controller
// HTTP Layer - Express request/response handling

import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service';
import { PaymentFilter, CreatePaymentDto, UpdatePaymentDto } from '../types';
import { successResponse, errorResponse, createdResponse, buildPaginationMeta } from '../utils/response.helper';

export class PaymentController {
  constructor(private service: PaymentService) {}

  getPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;
      const payment = await this.service.getPayment(id, tenantId);
      successResponse(res, payment);
    } catch (err) { next(err); }
  };

  listPayments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId;
      const filter: PaymentFilter = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
        search: req.query.search as string,
        status: req.query.status as any,
        type: req.query.type as any,
        paymentMethodId: req.query.paymentMethodId as string,
        invoiceId: req.query.invoiceId as string,
        payerId: req.query.payerId as string,
        minAmount: req.query.minAmount as string,
        maxAmount: req.query.maxAmount as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };
      const { data, total } = await this.service.listPayments(filter, tenantId);
      successResponse(res, data, 200, buildPaginationMeta(filter.page || 1, filter.limit || 20, total));
    } catch (err) { next(err); }
  };

  createPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId;
      const userId = req.userId;
      const dto: CreatePaymentDto = req.body;
      const payment = await this.service.createPayment(dto, tenantId, userId);
      createdResponse(res, payment);
    } catch (err) { next(err); }
  };

  processPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;
      const userId = req.userId;
      const { gatewayRef, gatewayResponse } = req.body;
      const payment = await this.service.processPayment(id, tenantId, userId, gatewayRef, gatewayResponse);
      successResponse(res, payment);
    } catch (err) { next(err); }
  };

  failPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;
      const userId = req.userId;
      const { reason } = req.body;
      const payment = await this.service.failPayment(id, tenantId, userId, reason);
      successResponse(res, payment);
    } catch (err) { next(err); }
  };

  cancelPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;
      const userId = req.userId;
      const payment = await this.service.cancelPayment(id, tenantId, userId);
      successResponse(res, payment);
    } catch (err) { next(err); }
  };

  updatePayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;
      const userId = req.userId;
      const dto: UpdatePaymentDto = req.body;
      const payment = await this.service.updatePayment(id, dto, tenantId, userId);
      successResponse(res, payment);
    } catch (err) { next(err); }
  };

  deletePayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;
      await this.service.deletePayment(id, tenantId);
      successResponse(res, { deleted: true });
    } catch (err) { next(err); }
  };

  getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const stats = await this.service.getDashboardStats(tenantId, startDate, endDate);
      successResponse(res, stats);
    } catch (err) { next(err); }
  };
}
