// ============================================================================
// M07 PURCHASE MANAGEMENT — Purchase Invoice & Return Controller
// ============================================================================

import { Request, Response } from 'express';
import { requireTenant, requireUser } from '@/common/middleware/require-tenant';
import { PurchaseService } from '../services/purchase.service';
import {
  createPurchaseInvoiceSchema,
  updatePurchaseInvoiceSchema,
  createPurchaseReturnSchema,
  ocrReviewSchema,
  purchaseInvoiceQuerySchema,
} from '../validators/purchase.schema';

export class PurchaseController {
  constructor(private purchaseService: PurchaseService) {}

  // ─── Invoice CRUD ───

  createInvoice = async (req: Request, res: Response) => {
    try {
      const validated = createPurchaseInvoiceSchema.parse(req.body);
      const company_id = requireTenant(req).companyId;
      // created_by कभी body से नहीं — schema उसे स्वीकार करती है (पुराने callers के लिए),
      // पर असली पहचान हमेशा token से ओवरराइट होती है, वरना कोई और के नाम पर बना सकता था।
      const invoice = await this.purchaseService.createPurchaseInvoice({ ...validated, company_id, created_by: requireUser(req).id });
      res.status(201).json({ success: true, data: invoice });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Validation failed' });
    }
  };

  getInvoices = async (req: Request, res: Response) => {
    try {
      const validated = purchaseInvoiceQuerySchema.parse({ ...req.query, company_id: requireTenant(req).companyId });
      const result = await this.purchaseService.getPurchaseInvoices(validated);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  getInvoiceById = async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const company_id = requireTenant(req).companyId;
      const invoice = await this.purchaseService.getPurchaseInvoiceById(id, company_id);
      res.status(200).json({ success: true, data: invoice });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  };

  updateInvoice = async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const company_id = requireTenant(req).companyId;
      const validated = updatePurchaseInvoiceSchema.parse(req.body);
      const invoice = await this.purchaseService.updatePurchaseInvoice(id, company_id, validated);
      res.status(200).json({ success: true, data: invoice });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  deleteInvoice = async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const company_id = requireTenant(req).companyId;
      await this.purchaseService.deletePurchaseInvoice(id, company_id);
      res.status(200).json({ success: true, message: 'Invoice deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  // ─── Workflow ───

  approveInvoice = async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const company_id = requireTenant(req).companyId;
      // approved_by/posted_by कभी body से नहीं — वरना कोई भी किसी और के नाम पर approve/post
      // करवा सकता था (audit trail झूठा)। असली पहचान सिर्फ़ token से।
      const approved_by = requireUser(req).id;
      const result = await this.purchaseService.approvePurchaseInvoice(id, company_id, approved_by);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  postInvoice = async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const company_id = requireTenant(req).companyId;
      const posted_by = requireUser(req).id;
      const result = await this.purchaseService.postPurchaseInvoice(id, company_id, posted_by);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  cancelInvoice = async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const company_id = requireTenant(req).companyId;
      await this.purchaseService.cancelPurchaseInvoice(id, company_id);
      res.status(200).json({ success: true, message: 'Invoice cancelled successfully' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  // ─── OCR ───

  uploadOCR = async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const company_id = requireTenant(req).companyId;

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Image file is required' });
      }

      const result = await this.purchaseService.uploadOCR(id, company_id, req.file.buffer);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  reviewOCR = async (req: Request, res: Response) => {
    try {
      const validated = ocrReviewSchema.parse(req.body);
      const company_id = requireTenant(req).companyId;
      const result = await this.purchaseService.reviewOCR(validated, company_id);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  // ─── Purchase Return ───

  createReturn = async (req: Request, res: Response) => {
    try {
      const validated = createPurchaseReturnSchema.parse(req.body);
      const company_id = requireTenant(req).companyId;
      const result = await this.purchaseService.createPurchaseReturn({ ...validated, company_id });
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  getReturns = async (req: Request, res: Response) => {
    try {
      const company_id = requireTenant(req).companyId;
      const page = req.query.page ? parseInt(req.query.page as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const result = await this.purchaseService.getPurchaseReturns(company_id, page, limit);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  getReturnById = async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const company_id = requireTenant(req).companyId;
      const result = await this.purchaseService.getPurchaseReturnById(id, company_id);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  };

  approveReturn = async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const company_id = requireTenant(req).companyId;
      const result = await this.purchaseService.approvePurchaseReturn(id, company_id);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  postReturn = async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const company_id = requireTenant(req).companyId;
      const posted_by = requireUser(req).id;
      const result = await this.purchaseService.postPurchaseReturn(id, company_id, posted_by);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };
}
