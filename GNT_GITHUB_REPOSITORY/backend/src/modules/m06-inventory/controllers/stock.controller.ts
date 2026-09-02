// GNT M06 — Stock Controller
import { Request, Response } from 'express';
import { StockService } from '../services/stock.service';
import {
  stockAdjustmentSchema,
  stockTransferSchema,
  availabilityCheckSchema,
  movementFilterSchema,
} from '../validators/inventory.schema';
import { MovementFilter } from '../types/inventory.types';

const stockService = new StockService();

export class StockController {
  async getStock(req: Request, res: Response) {
    try {
      const company_id = (req as any).tenant?.company_id;
      if (!company_id) return res.status(400).json({ error: 'Company context required' });

      const filter = {
        branch_id: req.query.branch_id as string | undefined,
        product_id: req.query.product_id as string | undefined,
        batch_id: req.query.batch_id as string | undefined,
      };

      const stock = await stockService.getStock(filter, company_id);
      return res.json({ success: true, data: stock });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  async getStockByProduct(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const company_id = (req as any).tenant?.company_id;
      const branch_id = req.query.branch_id as string | undefined;
      if (!company_id) return res.status(400).json({ error: 'Company context required' });

      const stock = await stockService.getStockByProduct(id, company_id, branch_id || null);
      return res.json({ success: true, data: stock });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  async adjustStock(req: Request, res: Response) {
    try {
      const validated = stockAdjustmentSchema.parse(req.body);
      const company_id = (req as any).tenant?.company_id;
      const userId = (req as any).user?.id;
      if (!company_id) return res.status(400).json({ error: 'Company context required' });

      const stock = await stockService.adjustStock(validated, company_id, userId);
      return res.json({ success: true, data: stock });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  async transferStock(req: Request, res: Response) {
    try {
      const validated = stockTransferSchema.parse(req.body);
      const company_id = (req as any).tenant?.company_id;
      const userId = (req as any).user?.id;
      if (!company_id) return res.status(400).json({ error: 'Company context required' });

      const result = await stockService.transferStock(validated, company_id, userId);
      return res.json({ success: true, data: result });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  async getStockMovements(req: Request, res: Response) {
    try {
      const company_id = (req as any).tenant?.company_id;
      if (!company_id) return res.status(400).json({ error: 'Company context required' });

      const parsed = movementFilterSchema.parse(req.query);
      const filter: MovementFilter = {
        ...parsed,
        from_date: parsed.from_date ? new Date(parsed.from_date) : undefined,
        to_date: parsed.to_date ? new Date(parsed.to_date) : undefined,
      };
      const result = await stockService.getStockMovements(filter, company_id);
      return res.json({ success: true, ...result });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  async getLowStock(req: Request, res: Response) {
    try {
      const company_id = (req as any).tenant?.company_id;
      const branch_id = req.query.branch_id as string | undefined;
      if (!company_id) return res.status(400).json({ error: 'Company context required' });

      const items = await stockService.getLowStock(company_id, branch_id);
      return res.json({ success: true, data: items });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  async checkAvailability(req: Request, res: Response) {
    try {
      const validated = availabilityCheckSchema.parse(req.body);
      const company_id = (req as any).tenant?.company_id;
      if (!company_id) return res.status(400).json({ error: 'Company context required' });

      // Inject company_id for repository context
      const result = await stockService.checkAvailability(validated);
      return res.json({ success: true, data: result });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }
}
