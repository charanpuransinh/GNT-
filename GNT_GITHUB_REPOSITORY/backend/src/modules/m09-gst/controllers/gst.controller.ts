import { Request, Response } from 'express';
import { requireTenant } from '@/common/middleware/require-tenant';
import { GSTService } from '../services/gst.service';
import { GSTRepository } from '../repositories/gst.repository';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const gstService = new GSTService(new GSTRepository(prisma));

export const GSTController = {
  async createTaxSlab(req: Request, res: Response) {
    // 2026-09-04 tenant fix: पहले `data: req.body` सीधे जाता था, यानी body में दूसरी
    // company की id भेजकर उनके यहाँ tax slab बनाई जा सकती थी। अब company token से आती है।
    const { company_id: _ignored, ...body } = req.body;
    const slab = await prisma.tax_rate_master.create({
      data: { ...body, company_id: requireTenant(req).companyId },
    });
    res.status(201).json(slab);
  },

  async getTaxSlabs(req: Request, res: Response) {
    // 2026-09-04 tenant fix: company token से, query string से नहीं
    const company_id = requireTenant(req).companyId;
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
    // 2026-09-04 tenant fix: GSTR1 सरकारी return है — company query से लेने का मतलब था
    // कि कोई भी दूसरी company का पूरा return पढ़ सकता था। अब token से।
    const company_id = requireTenant(req).companyId;
    const { period } = req.query as { period: string };
    const data = await gstService.getGSTR1(company_id, period);
    res.json(data);
  },

  async getGSTR3B(req: Request, res: Response) {
    // 2026-09-04 tenant fix: GSTR3B भी सरकारी return है — वही छेद, वही सुधार
    const company_id = requireTenant(req).companyId;
    const { period } = req.query as { period: string };
    const data = await gstService.getGSTR3B(company_id, period);
    res.json(data);
  },

  async reconcileGSTR2B(req: Request, res: Response) {
    // 2026-09-04 tenant fix: company body से नहीं — वही छेद जो बाक़ी जगह था
    const company_id = requireTenant(req).companyId;
    const { purchase_data } = req.body;
    const result = await gstService.reconcileGSTR2B(company_id, purchase_data);
    res.json(result);
  },
};
