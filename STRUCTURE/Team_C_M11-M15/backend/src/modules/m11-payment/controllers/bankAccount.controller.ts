// M11 Payment Module - Bank Account Controller

import { Request, Response, NextFunction } from 'express';
import { BankAccountService } from '../services/bankAccount.service';
import { CreateBankAccountDto, UpdateBankAccountDto } from '../types';
import { successResponse, createdResponse } from '../utils/response.helper';

export class BankAccountController {
  constructor(private service: BankAccountService) {}

  getAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;
      const account = await this.service.getAccount(id, tenantId);
      successResponse(res, account);
    } catch (err) { next(err); }
  };

  listAccounts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId;
      const isActive = req.query.isActive ? req.query.isActive === 'true' : undefined;
      const accounts = await this.service.listAccounts(tenantId, isActive);
      successResponse(res, accounts);
    } catch (err) { next(err); }
  };

  createAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId;
      const userId = req.userId;
      const dto: CreateBankAccountDto = req.body;
      const account = await this.service.createAccount(dto, tenantId, userId);
      createdResponse(res, account);
    } catch (err) { next(err); }
  };

  updateAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;
      const userId = req.userId;
      const dto: UpdateBankAccountDto = req.body;
      const account = await this.service.updateAccount(id, dto, tenantId, userId);
      successResponse(res, account);
    } catch (err) { next(err); }
  };

  deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;
      await this.service.deleteAccount(id, tenantId);
      successResponse(res, { deleted: true });
    } catch (err) { next(err); }
  };
}
