import { Request, Response } from 'express';
import { requireTenant } from '@/common/middleware/require-tenant';
import { EInvoiceService } from '../services/einvoice.service';
import { EInvoiceRepository } from '../repositories/einvoice.repository';
import { prisma } from '@/common/config/prisma';
import { HttpIRPProvider } from '../services/irp.provider';

const eInvoiceService = new EInvoiceService(new EInvoiceRepository(prisma), new HttpIRPProvider());

export const EInvoiceController = {
  async generateEInvoice(req: Request, res: Response) {
    try {
      const { invoice_id } = req.body;
      if (typeof invoice_id !== 'string' || !invoice_id.trim()) throw new Error('invoice_id is required');
      const result = await eInvoiceService.generateIRN(invoice_id, requireTenant(req).companyId);
      res.status(201).json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  },

  async cancelEInvoice(req: Request, res: Response) {
    try {
      const { irn, reason } = req.body;
      if (typeof irn !== 'string' || !irn.trim() || typeof reason !== 'string' || !reason.trim()) throw new Error('irn and reason are required');
      const result = await eInvoiceService.cancelIRN(irn, reason, requireTenant(req).companyId);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  },

  async getEInvoiceStatus(req: Request, res: Response) {
    const irn = String(req.params.irn);
    const status = await eInvoiceService.getStatus(irn, requireTenant(req).companyId);
    res.json(status);
  },

  async generateEWayBill(req: Request, res: Response) {
    try {
      const { invoice_id, transport_details } = req.body;
      if (typeof invoice_id !== 'string' || !invoice_id.trim()) throw new Error('invoice_id is required');
      const result = await eInvoiceService.generateEWayBill(invoice_id, transport_details, requireTenant(req).companyId);
      res.status(201).json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  },
};
