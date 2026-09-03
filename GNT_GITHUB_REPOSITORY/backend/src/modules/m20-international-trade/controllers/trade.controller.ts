// GNT M20 — Trade Controller (CRUD handlers)
// Owner: D4-DELTA

import { Request, Response, NextFunction } from 'express';
import { requireTenant } from '@/common/middleware/require-tenant';
import { PrismaClient } from '@prisma/client';
import { TradeService } from '../services/trade.service';
import { EventBus } from '../../../shared/events/event-bus';
import { AppError } from '../../../shared/errors/app-error';
import {
  CreateTradeShipmentSchema,
  ListTradeJobsQuerySchema,
  UpdateTradeShipmentSchema,
} from '../validators/trade.schema';

const prisma = new PrismaClient();
const eventBus = new EventBus(); // assumed singleton from shared infra

export class TradeController {
  private service: TradeService;

  constructor() {
    this.service = new TradeService(prisma, eventBus);
  }

  // POST /api/v1/trade/exports
  createExport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = requireTenant(req).companyId as string;
      if (!companyId) throw new AppError('UNAUTHORIZED', 'Company ID required', 401);

      const parsed = CreateTradeShipmentSchema.parse(req.body);
      const job = await this.service.createExportShipment({ ...parsed, company_id: companyId });
      res.status(201).json(job);
    } catch (err) {
      next(err);
    }
  };

  // POST /api/v1/trade/imports
  createImport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = requireTenant(req).companyId as string;
      if (!companyId) throw new AppError('UNAUTHORIZED', 'Company ID required', 401);

      const parsed = CreateTradeShipmentSchema.parse(req.body);
      const job = await this.service.createImportShipment({ ...parsed, company_id: companyId });
      res.status(201).json(job);
    } catch (err) {
      next(err);
    }
  };

  // GET /api/v1/trade/shipments
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = requireTenant(req).companyId as string;
      if (!companyId) throw new AppError('UNAUTHORIZED', 'Company ID required', 401);

      const parsed = ListTradeJobsQuerySchema.parse(req.query);
      const result = await this.service.listTradeJobs(companyId, parsed);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  // GET /api/v1/trade/shipments/:id
  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = requireTenant(req).companyId as string;
      if (!companyId) throw new AppError('UNAUTHORIZED', 'Company ID required', 401);

      const job = await this.service.getTradeJob(String(req.params.id), companyId);
      res.status(200).json(job);
    } catch (err) {
      next(err);
    }
  };

  // PATCH /api/v1/trade/shipments/:id
  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = requireTenant(req).companyId as string;
      if (!companyId) throw new AppError('UNAUTHORIZED', 'Company ID required', 401);

      const parsed = UpdateTradeShipmentSchema.parse(req.body);
      const job = await this.service.updateTradeJob(String(req.params.id), companyId, parsed);
      res.status(200).json(job);
    } catch (err) {
      next(err);
    }
  };

  // DELETE /api/v1/trade/shipments/:id
  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = requireTenant(req).companyId as string;
      if (!companyId) throw new AppError('UNAUTHORIZED', 'Company ID required', 401);

      await this.service.deleteTradeJob(String(req.params.id), companyId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
