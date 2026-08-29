/**
 * M08 SALES & BILLING — Sales Return Controller
 * Module: m08-sales | Team: B4-BRAVO
 */

import { Request, Response } from 'express';
import { returnService } from '../services/return.service';
import {
  salesReturnSchema,
  returnQuerySchema,
} from '../validators/sales.schema';

export class ReturnController {
  // ─── CREATE RETURN ───
  async createReturn(req: Request, res: Response): Promise<void> {
    try {
      const dto = salesReturnSchema.parse(req.body);
      const salesReturn = await returnService.createReturn(dto);
      res.status(201).json({ success: true, data: salesReturn });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // ─── GET RETURNS ───
  async getReturns(req: Request, res: Response): Promise<void> {
    try {
      const query = returnQuerySchema.parse({ ...req.query, companyId: req.headers['x-company-id'] });
      const result = await returnService.getReturns(query);
      res.status(200).json({ success: true, data: result.data, meta: { total: result.total, page: query.page, limit: query.limit } });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // ─── GET RETURN BY ID ───
  async getReturnById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.headers['x-company-id'] as string;
      const salesReturn = await returnService.getReturnById(id, companyId);
      if (!salesReturn) {
        res.status(404).json({ success: false, error: 'Return not found' });
        return;
      }
      res.status(200).json({ success: true, data: salesReturn });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // ─── APPROVE RETURN ───
  async approveReturn(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.headers['x-company-id'] as string;
      const salesReturn = await returnService.approveReturn(id, companyId);
      res.status(200).json({ success: true, data: salesReturn });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // ─── POST RETURN ───
  async postReturn(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.headers['x-company-id'] as string;
      const salesReturn = await returnService.postReturn(id, companyId);
      res.status(200).json({ success: true, data: salesReturn });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

export const returnController = new ReturnController();
