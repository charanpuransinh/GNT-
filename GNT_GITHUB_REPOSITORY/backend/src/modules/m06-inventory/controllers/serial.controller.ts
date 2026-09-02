// GNT M06 — Serial Controller
import { Request, Response } from 'express';
import { serialSchema, serialUpdateSchema } from '../validators/inventory.schema';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SerialController {
  async createSerial(req: Request, res: Response) {
    try {
      const validated = serialSchema.parse(req.body);
      const company_id = (req as any).tenant?.company_id;
      if (!company_id) return res.status(400).json({ error: 'Company context required' });
      const serial = await prisma.serial_master.create({ data: { ...validated, company_id } as any });
      return res.status(201).json({ success: true, data: serial });
    } catch (err: any) { return res.status(400).json({ success: false, error: err.message }); }
  }

  async getSerials(req: Request, res: Response) {
    try {
      const company_id = (req as any).tenant?.company_id;
      if (!company_id) return res.status(400).json({ error: 'Company context required' });
      const where: any = { company_id };
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
      const company_id = (req as any).tenant?.company_id;
      if (!company_id) return res.status(400).json({ error: 'Company context required' });
      const serial = await prisma.serial_master.update({ where: { id }, data: validated as any });
      return res.json({ success: true, data: serial });
    } catch (err: any) { return res.status(400).json({ success: false, error: err.message }); }
  }
}
