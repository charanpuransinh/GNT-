/**
 * M08 SALES & BILLING — Quotation Controller
 * Module: m08-sales | Team: B4-BRAVO
 */

import { Request, Response } from 'express';
import { quotationService } from '../services/quotation.service';
import {
  quotationSchema,
  quotationQuerySchema,
  salesOrderSchema,
} from '../validators/sales.schema';

export class QuotationController {
  // ─── CREATE QUOTATION ───
  async createQuotation(req: Request, res: Response): Promise<void> {
    try {
      const dto = quotationSchema.parse(req.body);
      const quotation = await quotationService.createQuotation(dto);
      res.status(201).json({ success: true, data: quotation });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // ─── GET QUOTATIONS ───
  async getQuotations(req: Request, res: Response): Promise<void> {
    try {
      const query = quotationQuerySchema.parse({ ...req.query, companyId: req.tenant.companyId });
      const result = await quotationService.getQuotations(query);
      res.status(200).json({ success: true, data: result.data, meta: { total: result.total, page: query.page, limit: query.limit } });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // ─── GET QUOTATION BY ID ───
  async getQuotationById(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const companyId = req.tenant.companyId as string;
      const quotation = await quotationService.getQuotationById(id, companyId);
      if (!quotation) {
        res.status(404).json({ success: false, error: 'Quotation not found' });
        return;
      }
      res.status(200).json({ success: true, data: quotation });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // ─── UPDATE QUOTATION ───
  async updateQuotation(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const companyId = req.tenant.companyId as string;
      const dto = quotationSchema.partial().parse(req.body);
      const quotation = await quotationService.updateQuotation(id, companyId, dto);
      res.status(200).json({ success: true, data: quotation });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // ─── SEND QUOTATION ───
  async sendQuotation(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const companyId = req.tenant.companyId as string;
      const quotation = await quotationService.sendQuotation(id, companyId);
      res.status(200).json({ success: true, data: quotation });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // ─── CONVERT QUOTATION TO ORDER ───
  async convertQuotationToOrder(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const companyId = req.tenant.companyId as string;
      const dto = salesOrderSchema.partial().parse(req.body);
      const order = await quotationService.convertQuotationToOrder(id, companyId, dto);
      res.status(201).json({ success: true, data: order });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // ─── DELETE QUOTATION ───
  async deleteQuotation(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const companyId = req.tenant.companyId as string;
      await quotationService.deleteQuotation(id, companyId);
      res.status(200).json({ success: true, message: 'Quotation deleted' });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

export const quotationController = new QuotationController();
