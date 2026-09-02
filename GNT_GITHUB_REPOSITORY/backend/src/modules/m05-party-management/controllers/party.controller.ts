// ============================================================================
// M05 PARTY MANAGEMENT — Controller
// ⚠️ tenant-सुरक्षा: कंपनी की पहचान सिर्फ़ req.tenant.companyId से —
//    x-company-id / body.company_id पर कभी भरोसा नहीं (टास्क #009 का नियम)
// ============================================================================

import { Request, Response } from 'express';
import { PartyService } from '../services/party.service';
import { partyEventHandlers } from '../events/party.handlers';
import { createPartySchema, updatePartySchema, partyQuerySchema } from '../validators/party.schema';

export class PartyController {
  constructor(private readonly service: PartyService) {}

  create = async (req: Request, res: Response) => {
    try {
      const company_id = req.tenant.companyId;
      const validated = createPartySchema.parse(req.body);
      const party = await this.service.createParty(company_id, validated, req.user?.id);
      await partyEventHandlers.publishCreated({ party_id: party.id, company_id, at: new Date() });
      res.status(201).json({ success: true, data: party });
    } catch (e: unknown) {
      res.status(400).json({ success: false, error: e instanceof Error ? e.message : 'Validation failed' });
    }
  };

  list = async (req: Request, res: Response) => {
    try {
      const company_id = req.tenant.companyId;
      const query = partyQuerySchema.parse(req.query);
      const result = await this.service.listParties(company_id, query);
      res.json({ success: true, data: result.data, meta: { total: result.total, page: result.page, limit: result.limit } });
    } catch (e: unknown) {
      res.status(400).json({ success: false, error: e instanceof Error ? e.message : 'Query failed' });
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const company_id = req.tenant.companyId;
      const party = await this.service.getPartyById(String(req.params.id), company_id);
      if (!party) return res.status(404).json({ success: false, error: 'Party not found' });
      return res.json({ success: true, data: party });
    } catch (e: unknown) {
      return res.status(400).json({ success: false, error: e instanceof Error ? e.message : 'Lookup failed' });
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const company_id = req.tenant.companyId;
      const validated = updatePartySchema.parse(req.body);
      const party = await this.service.updateParty(String(req.params.id), company_id, validated, req.user?.id);
      if (!party) return res.status(404).json({ success: false, error: 'Party not found' });
      await partyEventHandlers.publishUpdated({ party_id: party.id, company_id, at: new Date() });
      return res.json({ success: true, data: party });
    } catch (e: unknown) {
      return res.status(400).json({ success: false, error: e instanceof Error ? e.message : 'Update failed' });
    }
  };

  deactivate = async (req: Request, res: Response) => {
    try {
      const company_id = req.tenant.companyId;
      const id = String(req.params.id);
      const existing = await this.service.getPartyById(id, company_id);
      if (!existing) return res.status(404).json({ success: false, error: 'Party not found' });
      await this.service.deactivateParty(id, company_id);
      await partyEventHandlers.publishDeactivated({ party_id: id, company_id, at: new Date() });
      return res.json({ success: true, message: 'Party deactivated' });
    } catch (e: unknown) {
      return res.status(400).json({ success: false, error: e instanceof Error ? e.message : 'Deactivation failed' });
    }
  };

  getOutstanding = async (req: Request, res: Response) => {
    try {
      const company_id = req.tenant.companyId;
      const data = await this.service.getOutstanding(String(req.params.id), company_id);
      res.json({ success: true, data });
    } catch (e: unknown) {
      res.status(400).json({ success: false, error: e instanceof Error ? e.message : 'Lookup failed' });
    }
  };

  getAging = async (req: Request, res: Response) => {
    try {
      const company_id = req.tenant.companyId;
      const data = await this.service.getAging(String(req.params.id), company_id);
      res.json({ success: true, data });
    } catch (e: unknown) {
      res.status(400).json({ success: false, error: e instanceof Error ? e.message : 'Lookup failed' });
    }
  };
}
