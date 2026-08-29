// GNT M20 — HSN Controller
// Owner: D4-DELTA

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { HSNService } from '../services/hsn.service';
import { EventBus } from '../../../shared/events/event-bus';
import { SearchHSNQuerySchema, HSNValidationSchema } from '../validators/trade.schema';
import { AppError } from '../../../shared/errors/app-error';

const prisma = new PrismaClient();
const eventBus = new EventBus();

export class HSNController {
  private service: HSNService;

  constructor() {
    this.service = new HSNService(prisma, eventBus);
  }

  // GET /api/v1/hsn/search
  search = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = SearchHSNQuerySchema.parse(req.query);
      const results = await this.service.searchHSN(parsed.q, parsed.limit);
      res.status(200).json(results);
    } catch (err) {
      next(err);
    }
  };

  // GET /api/v1/hsn/:code
  getByCode = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getHSNDetails(req.params.code);
      if (!result) throw new AppError('NOT_FOUND', 'HSN code not found', 404);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  // POST /api/v1/hsn/validate
  validate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = HSNValidationSchema.parse(req.body);
      const result = await this.service.validateHSN(parsed.code, parsed.product_description);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  // GET /api/v1/hsn/chapters
  getChapters = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const chapters = await this.service.getChapters();
      res.status(200).json(chapters);
    } catch (err) {
      next(err);
    }
  };

  // GET /api/v1/hsn/chapters/:chapter/headings
  getHeadings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const headings = await this.service.getHeadings(req.params.chapter);
      res.status(200).json(headings);
    } catch (err) {
      next(err);
    }
  };
}
