// M11 Payment Module - Reconciliation Controller

import { Request, Response, NextFunction } from 'express';
import { ReconciliationService } from '../services/reconciliation.service';
import { CreateReconciliationDto, UpdateReconciliationItemDto } from '../types';
import { successResponse, createdResponse } from '../utils/response.helper';

export class ReconciliationController {
  constructor(private service: ReconciliationService) {}

  getReconciliation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const tenantId = String(req.tenantId ?? '');
      const recon = await this.service.getReconciliation(id, tenantId);
      successResponse(res, recon);
    } catch (err) { next(err); }
  };

  listReconciliations = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = String(req.tenantId ?? '');
      const bankAccountId = req.query.bankAccountId as string;
      const recons = await this.service.listReconciliations(tenantId, bankAccountId);
      successResponse(res, recons);
    } catch (err) { next(err); }
  };

  createReconciliation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = String(req.tenantId ?? '');
      const userId = String(req.userId ?? '');
      const dto: CreateReconciliationDto = req.body;
      const recon = await this.service.createReconciliation(dto, tenantId, userId);
      createdResponse(res, recon);
    } catch (err) { next(err); }
  };

  uploadStatement = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const tenantId = String(req.tenantId ?? '');
      const userId = String(req.userId ?? '');
      const statementData = req.body.statementData;
      const recon = await this.service.uploadStatement(id, statementData, tenantId, userId);
      successResponse(res, recon);
    } catch (err) { next(err); }
  };

  autoMatch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const tenantId = String(req.tenantId ?? '');
      const userId = String(req.userId ?? '');
      const result = await this.service.autoMatch(id, tenantId, userId);
      successResponse(res, result);
    } catch (err) { next(err); }
  };

  resolveItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const itemId = String(req.params.itemId);
      const tenantId = String(req.tenantId ?? '');
      const userId = String(req.userId ?? '');
      const dto: UpdateReconciliationItemDto = req.body;
      const item = await this.service.resolveItem(itemId, dto, tenantId, userId);
      successResponse(res, item);
    } catch (err) { next(err); }
  };
}
