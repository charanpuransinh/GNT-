// GNT M20 — Customs Controller
// Owner: D4-DELTA

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { CustomsService } from '../services/customs.service';
import { FXService } from '../services/fx.service';
import { CustomsCalculateSchema } from '../validators/trade.schema';
import { AppError } from '../../../shared/errors/app-error';

const prisma = new PrismaClient();

export class CustomsController {
  private service: CustomsService;

  constructor() {
    const fxService = new FXService(prisma);
    this.service = new CustomsService(prisma, undefined, fxService);
  }

  // POST /api/v1/customs/calculate
  calculate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.headers['x-company-id'] as string;
      if (!companyId) throw new AppError('UNAUTHORIZED', 'Company ID required', 401);

      const parsed = CustomsCalculateSchema.parse(req.body);
      const result = await this.service.calculateCustomsDuty(
        companyId,
        parsed.hsn_code,
        parsed.assessable_value,
        parsed.currency,
        parsed.fx_rate
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  // GET /api/v1/customs/rules
  getRules = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.headers['x-company-id'] as string;
      if (!companyId) throw new AppError('UNAUTHORIZED', 'Company ID required', 401);

      const hsnCode = req.query.hsn_code as string;
      if (!hsnCode) throw new AppError('BAD_REQUEST', 'hsn_code query param required', 400);

      const results = await this.service.getCustomsRules(companyId, hsnCode);
      res.status(200).json(results);
    } catch (err) {
      next(err);
    }
  };
}
