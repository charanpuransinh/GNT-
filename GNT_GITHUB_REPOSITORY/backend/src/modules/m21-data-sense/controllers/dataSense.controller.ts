/** M21 — HTTP परत */
import type { NextFunction, Request, Response } from 'express';
import { dataSenseService } from '../services/dataSense.service';
import { analyzeSheetSchema } from '../validators/dataSense.schema';
import { GROUP_SPECS } from '../services/sense.engine';
import { DATA_GROUP_OWNER } from '../index';

export class DataSenseController {
  /** POST /api/v1/data-sense/analyze */
  async analyze(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.tenant?.companyId ?? (req.user?.companyId as string);
      if (!companyId) {
        res.status(400).json({ success: false, error: 'company_id required' });
        return;
      }
      const sheet = analyzeSheetSchema.parse(req.body);
      const result = dataSenseService.analyze(companyId, sheet);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  /** GET /api/v1/data-sense/field-map — कौन सा group किस module का, और उसके fields */
  async fieldMap(_req: Request, res: Response): Promise<void> {
    const data = Object.entries(GROUP_SPECS).map(([group, spec]) => ({
      group,
      ownerModule: DATA_GROUP_OWNER[group as keyof typeof DATA_GROUP_OWNER],
      required: spec.required,
      fields: Object.keys(spec.fields),
    }));
    res.json({ success: true, data });
  }
}

export const dataSenseController = new DataSenseController();
