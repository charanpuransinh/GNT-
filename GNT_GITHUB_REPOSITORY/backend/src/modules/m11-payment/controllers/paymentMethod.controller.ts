// M11 Payment Module - Payment Method Controller

import { Request, Response, NextFunction } from 'express';
import { PaymentMethodService } from '../services/paymentMethod.service';
import { CreatePaymentMethodDto, UpdatePaymentMethodDto } from '../types';
import { successResponse, createdResponse } from '../utils/response.helper';

export class PaymentMethodController {
  constructor(private service: PaymentMethodService) {}

  getMethod = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const tenantId = String(req.tenantId ?? '');
      const method = await this.service.getMethod(id, tenantId);
      successResponse(res, method);
    } catch (err) { next(err); }
  };

  listMethods = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = String(req.tenantId ?? '');
      const isActive = req.query.isActive ? req.query.isActive === 'true' : undefined;
      const methods = await this.service.listMethods(tenantId, isActive);
      successResponse(res, methods);
    } catch (err) { next(err); }
  };

  createMethod = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = String(req.tenantId ?? '');
      const userId = String(req.userId ?? '');
      const dto: CreatePaymentMethodDto = req.body;
      const method = await this.service.createMethod(dto, tenantId, userId);
      createdResponse(res, method);
    } catch (err) { next(err); }
  };

  updateMethod = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const tenantId = String(req.tenantId ?? '');
      const userId = String(req.userId ?? '');
      const dto: UpdatePaymentMethodDto = req.body;
      const method = await this.service.updateMethod(id, dto, tenantId, userId);
      successResponse(res, method);
    } catch (err) { next(err); }
  };

  deleteMethod = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const tenantId = String(req.tenantId ?? '');
      await this.service.deleteMethod(id, tenantId);
      successResponse(res, { deleted: true });
    } catch (err) { next(err); }
  };
}
