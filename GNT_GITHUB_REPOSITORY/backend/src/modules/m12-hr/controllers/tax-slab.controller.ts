// M12 — Tax Slab Controller (admin: owner/accountant slabs add/edit — effective-dated)
import { Request, Response } from 'express';
import { requireUser } from '@/common/middleware/require-tenant';
import { taxSlabService } from '../services/tax-slab.service';

export class TaxSlabController {
  async list(req: Request, res: Response) {
    try {
      const { financialYear, regime } = req.query;
      if (!financialYear || !regime) {
        return res.status(400).json({ success: false, error: 'financialYear and regime required' });
      }
      const slabs = await taxSlabService.listSlabs(String(financialYear), regime as 'OLD' | 'NEW');
      res.json({ success: true, data: slabs });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const userId = requireUser(req).id;
      const slabs = Array.isArray(req.body) ? req.body : [req.body];
      const result = await taxSlabService.createSlabs(slabs, userId);
      res.status(201).json({ success: true, count: result.count });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

export const taxSlabController = new TaxSlabController();
