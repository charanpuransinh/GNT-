// M11 Payment Module - Refund Controller

import { Request, Response, NextFunction } from 'express';
import { RefundService } from '../services/refund.service';
import { RefundFilter, CreateRefundDto, UpdateRefundDto, RefundStatus } from '../types';
import { successResponse, createdResponse, buildPaginationMeta } from '../utils/response.helper';

export class RefundController {
  constructor(private service: RefundService) {}

  getRefund = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const tenantId = req.tenant?.companyId ?? '';
      const refund = await this.service.getRefund(id, tenantId);
      successResponse(res, refund);
    } catch (err) { next(err); }
  };

  listRefunds = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenant?.companyId ?? '';
      const filter: RefundFilter = {
        page: req.query.page ? parseInt(String(req.query.page)) : 1,
        limit: req.query.limit ? parseInt(String(req.query.limit)) : 20,
        status: typeof req.query.status === 'string' ? req.query.status as RefundStatus : undefined,
        transactionId: req.query.transactionId ? String(req.query.transactionId) : undefined,
      };
      const { data, total } = await this.service.listRefunds(filter, tenantId);
      successResponse(res, data, 200, buildPaginationMeta(filter.page || 1, filter.limit || 20, total));
    } catch (err) { next(err); }
  };

  createRefund = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenant?.companyId ?? '';
      const userId = req.user?.id ?? '';
      const dto: CreateRefundDto = req.body;
      const refund = await this.service.createRefund(dto, tenantId, userId);
      createdResponse(res, refund);
    } catch (err) { next(err); }
  };

  approveRefund = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const tenantId = req.tenant?.companyId ?? '';
      const userId = req.user?.id ?? '';
      const refund = await this.service.approveRefund(id, tenantId, userId);
      successResponse(res, refund);
    } catch (err) { next(err); }
  };

  rejectRefund = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const tenantId = req.tenant?.companyId ?? '';
      const userId = req.user?.id ?? '';
      const { reason } = req.body;
      const refund = await this.service.rejectRefund(id, tenantId, userId, reason);
      successResponse(res, refund);
    } catch (err) { next(err); }
  };

  updateRefund = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const tenantId = req.tenant?.companyId ?? '';
      const userId = req.user?.id ?? '';
      const dto: UpdateRefundDto = req.body;
      const refund = await this.service.updateRefund(id, dto, tenantId, userId);
      successResponse(res, refund);
    } catch (err) { next(err); }
  };

  deleteRefund = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const tenantId = req.tenant?.companyId ?? '';
      await this.service.deleteRefund(id, tenantId);
      successResponse(res, { deleted: true });
    } catch (err) { next(err); }
  };
}
