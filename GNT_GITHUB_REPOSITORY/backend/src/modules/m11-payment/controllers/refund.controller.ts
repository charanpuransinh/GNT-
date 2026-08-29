// M11 Payment Module - Refund Controller

import { Request, Response, NextFunction } from 'express';
import { RefundService } from '../services/refund.service';
import { RefundFilter, CreateRefundDto, UpdateRefundDto } from '../types';
import { successResponse, createdResponse, buildPaginationMeta } from '../utils/response.helper';

export class RefundController {
  constructor(private service: RefundService) {}

  getRefund = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;
      const refund = await this.service.getRefund(id, tenantId);
      successResponse(res, refund);
    } catch (err) { next(err); }
  };

  listRefunds = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId;
      const filter: RefundFilter = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        status: req.query.status as any,
        transactionId: req.query.transactionId as string,
      };
      const { data, total } = await this.service.listRefunds(filter, tenantId);
      successResponse(res, data, 200, buildPaginationMeta(filter.page || 1, filter.limit || 20, total));
    } catch (err) { next(err); }
  };

  createRefund = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId;
      const userId = req.userId;
      const dto: CreateRefundDto = req.body;
      const refund = await this.service.createRefund(dto, tenantId, userId);
      createdResponse(res, refund);
    } catch (err) { next(err); }
  };

  approveRefund = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;
      const userId = req.userId;
      const refund = await this.service.approveRefund(id, tenantId, userId);
      successResponse(res, refund);
    } catch (err) { next(err); }
  };

  rejectRefund = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;
      const userId = req.userId;
      const { reason } = req.body;
      const refund = await this.service.rejectRefund(id, tenantId, userId, reason);
      successResponse(res, refund);
    } catch (err) { next(err); }
  };

  updateRefund = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;
      const userId = req.userId;
      const dto: UpdateRefundDto = req.body;
      const refund = await this.service.updateRefund(id, dto, tenantId, userId);
      successResponse(res, refund);
    } catch (err) { next(err); }
  };

  deleteRefund = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;
      await this.service.deleteRefund(id, tenantId);
      successResponse(res, { deleted: true });
    } catch (err) { next(err); }
  };
}
