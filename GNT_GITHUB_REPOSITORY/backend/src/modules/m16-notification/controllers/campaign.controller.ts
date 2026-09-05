// M16 — Campaign Controller (company-scoped; order-link resolve public)
import { Request, Response, NextFunction } from 'express';
import { requireTenant } from '@/common/middleware/require-tenant';
import { campaignService } from '../services/campaign.service';

export class CampaignController {
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = requireTenant(req).companyId;
      const userId = req.user?.id ?? '';
      const campaign = await campaignService.create(req.body, companyId, userId);
      res.status(201).json({ success: true, data: campaign });
    } catch (err) { next(err); }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = requireTenant(req).companyId;
      const campaigns = await campaignService.list(companyId);
      res.json({ success: true, data: campaigns });
    } catch (err) { next(err); }
  };

  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = requireTenant(req).companyId;
      const campaign = await campaignService.get(String(req.params.id), companyId);
      res.json({ success: true, data: campaign });
    } catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = requireTenant(req).companyId;
      const campaign = await campaignService.update(String(req.params.id), companyId, req.body);
      res.json({ success: true, data: campaign });
    } catch (err) { next(err); }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = requireTenant(req).companyId;
      await campaignService.delete(String(req.params.id), companyId);
      res.json({ success: true, data: { deleted: true } });
    } catch (err) { next(err); }
  };

  generateOrderLink = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = requireTenant(req).companyId;
      const partyId = req.body?.partyId as string;
      if (!partyId) return res.status(400).json({ success: false, error: 'partyId required' });
      const result = await campaignService.generateOrderLink(String(req.params.id), companyId, partyId);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  send = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = requireTenant(req).companyId;
      const userId = req.user?.id ?? '';
      const result = await campaignService.send(String(req.params.id), companyId, userId);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  /** public — buyer बिना login link खोलता है */
  resolveOrderLink = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await campaignService.resolveOrderLink(String(req.params.token));
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  };
}

export const campaignController = new CampaignController();
