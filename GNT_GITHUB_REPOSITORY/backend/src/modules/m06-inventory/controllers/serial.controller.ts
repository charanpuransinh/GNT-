// GNT M06 — Serial Controller
import { Request, Response } from 'express';
import { requireTenant } from '@/common/middleware/require-tenant';
import { serialSchema, serialUpdateSchema } from '../validators/inventory.schema';
import { Prisma } from '@prisma/client';
import { prisma } from '@/common/config/prisma';

export class SerialController {
  async createSerial(req: Request, res: Response) {
    try {
      const validated = serialSchema.parse(req.body);
      const company_id = requireTenant(req).companyId;
      if (!company_id) return res.status(400).json({ error: 'Company context required' });
      const serial = await prisma.serial_master.create({ data: { ...validated, company_id } });
      return res.status(201).json({ success: true, data: serial });
    } catch (err: any) { return res.status(400).json({ success: false, error: err.message }); }
  }

  async getSerials(req: Request, res: Response) {
    try {
      const company_id = requireTenant(req).companyId;
      if (!company_id) return res.status(400).json({ error: 'Company context required' });
      const where: Prisma.serial_masterWhereInput = { company_id };
      if (req.query.product_id) where.product_id = req.query.product_id as string;
      if (req.query.status) where.status = req.query.status as string;
      const serials = await prisma.serial_master.findMany({ where, include: { product: true }, orderBy: { created_at: 'desc' } });
      return res.json({ success: true, data: serials });
    } catch (err: any) { return res.status(400).json({ success: false, error: err.message }); }
  }

  async updateSerialStatus(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const validated = serialUpdateSchema.parse(req.body);
      const company_id = requireTenant(req).companyId;
      if (!company_id) return res.status(400).json({ error: 'Company context required' });
      // यहाँ भी company_id सिर्फ़ जाँचा जाता था, लगाया नहीं जाता था
      const { count } = await prisma.serial_master.updateMany({ where: { id, company_id }, data: validated });
      if (count === 0) return res.status(404).json({ success: false, error: 'Serial not found' });
      const serial = await prisma.serial_master.findFirst({ where: { id, company_id } });
      return res.json({ success: true, data: serial });
    } catch (err: any) { return res.status(400).json({ success: false, error: err.message }); }
  }
}
