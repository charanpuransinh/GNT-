// GNT M06 — Batch Controller
import { Request, Response } from 'express';
import { batchSchema, batchUpdateSchema } from '../validators/inventory.schema';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class BatchController {
  async createBatch(req: Request, res: Response) {
    try {
      const validated = batchSchema.parse(req.body);
      const company_id = (req as any).tenant?.company_id;
      if (!company_id) return res.status(400).json({ error: 'Company context required' });
      const batch = await prisma.batch_master.create({ data: { ...validated, company_id } as any });
      return res.status(201).json({ success: true, data: batch });
    } catch (err: any) { return res.status(400).json({ success: false, error: err.message }); }
  }

  async getBatches(req: Request, res: Response) {
    try {
      const company_id = (req as any).tenant?.company_id;
      if (!company_id) return res.status(400).json({ error: 'Company context required' });
      const where: any = { company_id };
      if (req.query.product_id) where.product_id = req.query.product_id as string;
      if (req.query.expiry_before) where.expiry_date = { lte: new Date(req.query.expiry_before as string) };
      const batches = await prisma.batch_master.findMany({ where, include: { product: true }, orderBy: { created_at: 'desc' } });
      return res.json({ success: true, data: batches });
    } catch (err: any) { return res.status(400).json({ success: false, error: err.message }); }
  }

  async updateBatch(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const validated = batchUpdateSchema.parse(req.body);
      const company_id = (req as any).tenant?.company_id;
      if (!company_id) return res.status(400).json({ error: 'Company context required' });
      const batch = await prisma.batch_master.update({ where: { id }, data: validated as any });
      return res.json({ success: true, data: batch });
    } catch (err: any) { return res.status(400).json({ success: false, error: err.message }); }
  }
}
