// M12 — TDS Section Controller (vendor / non-salary payment TDS: 194C, 194J, 194I, ...)
// Rates come from config/tds_slabs.json — see tds-section.service.ts
import { Request, Response } from 'express';
import { tdsSectionService } from '../services/tds-section.service';
import { CalculateTdsDto } from '../validators/tds-section.schema';

export class TdsSectionController {
  /** GET /api/v1/hr/tds-sections — current section config + which source is live (file vs fallback). */
  async list(_req: Request, res: Response) {
    try {
      const cfg = tdsSectionService.getConfig();
      res.json({
        success: true,
        source: cfg.source,
        configPath: cfg.path,
        meta: cfg.meta,
        sections: cfg.sections,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /** POST /api/v1/hr/tds-sections/calculate — { section, amount, deducteeType? } */
  async calculate(req: Request, res: Response) {
    try {
      const parsed = CalculateTdsDto.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.issues });
      }
      const result = tdsSectionService.calculate(parsed.data);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

export const tdsSectionController = new TdsSectionController();
