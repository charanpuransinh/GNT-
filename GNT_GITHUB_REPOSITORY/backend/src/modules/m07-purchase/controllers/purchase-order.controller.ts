import { Request, Response } from 'express';
import { requireTenant, requireUser } from '@/common/middleware/require-tenant';
import { PurchaseOrderService } from '../services/po.service';
import { createPurchaseOrderSchema, updatePurchaseOrderSchema, purchaseOrderQuerySchema } from '../validators/purchase.schema';

export class PurchaseOrderController {
  constructor(private readonly service: PurchaseOrderService) {}

  // created_by कभी body से नहीं — असली पहचान token से (नीचे convert जैसा ही कारण)
  create = async (req: Request, res: Response) => {
    try { const data = createPurchaseOrderSchema.parse(req.body); const company_id = requireTenant(req).companyId; res.status(201).json({ success: true, data: await this.service.createPO({ ...data, company_id, created_by: requireUser(req).id }) }); }
    catch (e: any) { res.status(400).json({ success: false, message: e.message }); }
  };

  list = async (req: Request, res: Response) => {
    try { const data = purchaseOrderQuerySchema.parse({ ...req.query, company_id: requireTenant(req).companyId }); res.json({ success: true, data: await this.service.getPOs(data) }); }
    catch (e: any) { res.status(400).json({ success: false, message: e.message }); }
  };

  get = async (req: Request, res: Response) => {
    try { const company_id = String(requireTenant(req).companyId || ''); if (!company_id) throw new Error('Company context is required'); res.json({ success: true, data: await this.service.getPOById(String(req.params.id), company_id) }); }
    catch (e: any) { res.status(404).json({ success: false, message: e.message }); }
  };

  update = async (req: Request, res: Response) => {
    try { const company_id = String(requireTenant(req).companyId || ''); if (!company_id) throw new Error('Company context is required'); const data = updatePurchaseOrderSchema.parse(req.body); res.json({ success: true, data: await this.service.updatePO(String(req.params.id), company_id, data) }); }
    catch (e: any) { res.status(400).json({ success: false, message: e.message }); }
  };

  send = async (req: Request, res: Response) => {
    try { const company_id = String(requireTenant(req).companyId || ''); if (!company_id) throw new Error('Company context is required'); res.json(await this.service.sendPO(String(req.params.id), company_id)); }
    catch (e: any) { res.status(400).json({ success: false, message: e.message }); }
  };

  receive = async (req: Request, res: Response) => {
    try { const company_id = String(requireTenant(req).companyId || ''); if (!company_id) throw new Error('Company context is required'); res.json(await this.service.receivePO(String(req.params.id), company_id, req.body.received_quantities || {})); }
    catch (e: any) { res.status(400).json({ success: false, message: e.message }); }
  };

  cancel = async (req: Request, res: Response) => {
    try { const company_id = String(requireTenant(req).companyId || ''); if (!company_id) throw new Error('Company context is required'); res.json(await this.service.cancelPO(String(req.params.id), company_id)); }
    catch (e: any) { res.status(400).json({ success: false, message: e.message }); }
  };

  // पहले: userId `req.body.user_id` से भी लिया जाता था — कोई भी login किया हुआ user
  // किसी और के नाम पर invoice का created_by लिखवा सकता था (audit trail झूठा)।
  // असली पहचान सिर्फ़ token से आती है, body से कभी नहीं।
  convert = async (req: Request, res: Response) => {
    try { const company_id = String(requireTenant(req).companyId || ''); const userId = requireUser(req).id; if (!company_id) throw new Error('Company context is required'); res.json({ success: true, data: await this.service.convertPOToInvoice(String(req.params.id), company_id, userId) }); }
    catch (e: any) { res.status(400).json({ success: false, message: e.message }); }
  };
}
