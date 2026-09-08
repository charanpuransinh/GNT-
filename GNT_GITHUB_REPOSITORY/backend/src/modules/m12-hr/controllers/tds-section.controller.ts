// M12 — TDS Section Controller (vendor / non-salary payment TDS: 194C, 194J, 194I, ...)
// Rates come from config/tds_slabs.json — see tds-section.service.ts
import { Request, Response } from 'express';
import { tdsSectionService } from '../services/tds-section.service';
import { CalculateTdsDto } from '../validators/tds-section.schema';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export class TdsSectionController {
  /** GET /api/v1/hr/tds-sections — current section config + which source is live (file vs fallback). */
  list(_req: Request, res: Response): void {
    try {
      const cfg = tdsSectionService.getConfig();
      res.json({
        success: true,
        source: cfg.source,
        configPath: cfg.path,
        meta: cfg.meta,
        sections: cfg.sections,
      });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: errorMessage(error) });
    }
  }

  /** POST /api/v1/hr/tds-sections/calculate — { section, amount, deducteeType? } */
  calculate(req: Request, res: Response): void {
    try {
      const parsed = CalculateTdsDto.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: parsed.error.issues });
        return;
      }
      const result = tdsSectionService.calculate(parsed.data);
      res.json({ success: true, data: result });
    } catch (error: unknown) {
      res.status(400).json({ success: false, error: errorMessage(error) });
    }
  }
}

export const tdsSectionController = new TdsSectionController();
