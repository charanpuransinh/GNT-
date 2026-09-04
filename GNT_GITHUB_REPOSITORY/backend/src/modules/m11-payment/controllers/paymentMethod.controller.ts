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
      const tenantId = req.tenant?.companyId ?? '';
      const method = await this.service.getMethod(id, tenantId);
      successResponse(res, method);
    } catch (err) { next(err); }
  };

  listMethods = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenant?.companyId ?? '';
      const isActive = req.query.isActive ? req.query.isActive === 'true' : undefined;
      const methods = await this.service.listMethods(tenantId, isActive);
      successResponse(res, methods);
    } catch (err) { next(err); }
  };

  createMethod = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenant?.companyId ?? '';
      const userId = req.user?.id ?? '';
      const dto: CreatePaymentMethodDto = req.body;
      const method = await this.service.createMethod(dto, tenantId, userId);
      createdResponse(res, method);
    } catch (err) { next(err); }
  };

  updateMethod = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const tenantId = req.tenant?.companyId ?? '';
      const userId = req.user?.id ?? '';
      const dto: UpdatePaymentMethodDto = req.body;
      const method = await this.service.updateMethod(id, dto, tenantId, userId);
      successResponse(res, method);
    } catch (err) { next(err); }
  };

  deleteMethod = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const tenantId = req.tenant?.companyId ?? '';
      await this.service.deleteMethod(id, tenantId);
      successResponse(res, { deleted: true });
    } catch (err) { next(err); }
  };
}
