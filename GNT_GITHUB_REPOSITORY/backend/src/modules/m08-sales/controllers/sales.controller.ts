/**
 * M08 SALES & BILLING — Sales Invoice Controller
 * Module: m08-sales | Team: B4-BRAVO
 */

import { Request, Response } from 'express';
import { requireTenant, requireUser } from '@/common/middleware/require-tenant';
import { salesService } from '../services/sales.service';
import {
  salesInvoiceSchema,
  invoiceQuerySchema,
  invoicePaymentSchema,
  printRequestSchema,
  shareRequestSchema,
} from '../validators/sales.schema';

export class SalesController {
  // ─── CREATE INVOICE ───
  async createInvoice(req: Request, res: Response): Promise<void> {
    try {
      const dto = { ...salesInvoiceSchema.parse(req.body), companyId: requireTenant(req).companyId };
      const invoice = await salesService.createInvoice(dto);
      res.status(201).json({ success: true, data: invoice });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // ─── GET INVOICES ───
  async getInvoices(req: Request, res: Response): Promise<void> {
    try {
      const query = invoiceQuerySchema.parse({ ...req.query, companyId: requireTenant(req).companyId });
      const result = await salesService.getInvoices(query);
      res.status(200).json({ success: true, data: result.data, meta: { total: result.total, page: query.page, limit: query.limit } });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // ─── GET INVOICE BY ID ───
  async getInvoiceById(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const companyId = requireTenant(req).companyId as string;
      const invoice = await salesService.getInvoiceById(id, companyId);
      if (!invoice) {
        res.status(404).json({ success: false, error: 'Invoice not found' });
        return;
      }
      res.status(200).json({ success: true, data: invoice });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // ─── UPDATE INVOICE ───
  async updateInvoice(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const companyId = requireTenant(req).companyId as string;
      const dto = salesInvoiceSchema.partial().parse(req.body);
      const invoice = await salesService.updateInvoice(id, companyId, dto);
      res.status(200).json({ success: true, data: invoice });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // ─── DELETE INVOICE ───
  async deleteInvoice(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const companyId = requireTenant(req).companyId as string;
      await salesService.deleteInvoice(id, companyId);
      res.status(200).json({ success: true, message: 'Invoice deleted' });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // ─── APPROVE INVOICE ───
  async approveInvoice(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const companyId = requireTenant(req).companyId as string;
      // पहले x-user-id header से लिया जाता था — कोई भी client यह header मनचाहा भेजकर
      // किसी और के नाम पर invoice approve करवा सकता था (audit trail झूठा)। असली
      // पहचान सिर्फ़ token से।
      const approvedBy = requireUser(req).id;
      const invoice = await salesService.approveInvoice(id, companyId, approvedBy);
      res.status(200).json({ success: true, data: invoice });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // ─── POST INVOICE ───
  async postInvoice(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const companyId = requireTenant(req).companyId as string;
      // वही कारण — token से, header से कभी नहीं
      const postedBy = requireUser(req).id;
      const invoice = await salesService.postInvoice(id, companyId, postedBy);
      res.status(200).json({ success: true, data: invoice });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // ─── RECORD PAYMENT ───
  async recordPayment(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const companyId = requireTenant(req).companyId as string;
      const payment = invoicePaymentSchema.parse(req.body);
      const invoice = await salesService.recordPayment(id, companyId, payment);
      res.status(200).json({ success: true, data: invoice });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // ─── GENERATE PRINT ───
  async generatePrint(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const companyId = requireTenant(req).companyId as string;
      const { template } = printRequestSchema.parse({ template: req.query.template || 'a4', invoiceId: id });
      const html = await salesService.generatePrint(id, companyId, template);
      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(html);
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // ─── SHARE INVOICE ───
  async shareInvoice(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const companyId = requireTenant(req).companyId as string;
      const { method, recipient, message } = shareRequestSchema.parse(req.body);
      const result = await salesService.shareInvoice(id, companyId, method, recipient);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // ─── CONVERT ORDER TO INVOICE ───
  async convertOrderToInvoice(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const companyId = requireTenant(req).companyId as string;
      const dto = salesInvoiceSchema.partial().parse(req.body);
      const invoice = await salesService.convertOrderToInvoice(id, companyId, dto);
      res.status(201).json({ success: true, data: invoice });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

export const salesController = new SalesController();
