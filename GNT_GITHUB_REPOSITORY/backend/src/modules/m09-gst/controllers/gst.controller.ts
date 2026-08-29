import { Request, Response } from 'express';
import { GSTService } from '../services/gst.service';
import { GSTRepository } from '../repositories/gst.repository';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const gstService = new GSTService(new GSTRepository(prisma));

export const GSTController = {
  async createTaxSlab(req: Request, res: Response) {
    const slab = await prisma.tax_rate_master.create({ data: req.body });
    res.status(201).json(slab);
  },

  async getTaxSlabs(req: Request, res: Response) {
    const { company_id } = req.query;
    const slabs = await prisma.tax_rate_master.findMany({
      where: { company_id: String(company_id), is_active: true },
    });
    res.json(slabs);
  },

  async calculateTax(req: Request, res: Response) {
    try {
      const { items, state_code, company_state_code, company_id } = req.body;
      const result = await gstService.calculateTax(items, state_code, company_state_code, company_id);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  },

  async getGSTR1(req: Request, res: Response) {
    const { company_id, period } = req.query as { company_id: string; period: string };
    const data = await gstService.getGSTR1(company_id, period);
    res.json(data);
  },

  async getGSTR3B(req: Request, res: Response) {
    const { company_id, period } = req.query as { company_id: string; period: string };
    const data = await gstService.getGSTR3B(company_id, period);
    res.json(data);
  },

  async reconcileGSTR2B(req: Request, res: Response) {
    const { company_id, purchase_data } = req.body;
    const result = await gstService.reconcileGSTR2B(company_id, purchase_data);
    res.json(result);
  },
};
