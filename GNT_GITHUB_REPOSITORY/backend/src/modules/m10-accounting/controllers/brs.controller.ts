import { requireTenant } from '@/common/middleware/require-tenant';
import { Request, Response } from 'express';
import { BRSService } from '../services/brs.service';
import { prisma } from '@/common/config/prisma';

const brsService = new BRSService(prisma);

export const BRSController = {
  // पहले company_id सीधे req.body से जाता था — कोई भी दूसरी company के नाम पर
  // (और उसके bank account के हिसाब से) reconciliation बना सकता था। अब token से।
  async createBRS(req: Request, res: Response) {
    try {
      const company_id = requireTenant(req).companyId;
      const { company_id: _ignored, ...body } = req.body;
      const brs = await brsService.createBRS(company_id, body);
      res.status(201).json(brs);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  },

  async getBRSList(req: Request, res: Response) {
// 2026-09-04 tenant fix: company अब token से (requireTenant), query string से नहीं —
    // पहले कोई भी अपनी request में दूसरी company की id डालकर उनका लेखा-जोखा पढ़ सकता था।
    const company_id = requireTenant(req).companyId;
    const { bank_account_id } = req.query;
    const list = await prisma.bank_reconciliation.findMany({
      where: {
        company_id: String(company_id),
        ...(bank_account_id ? { bank_account_id: String(bank_account_id) } : {}),
      },
      include: { items: true },
      orderBy: { statement_date: 'desc' },
    });
    res.json(list);
  },

  async reconcileItem(req: Request, res: Response) {
    try {
      const company_id = requireTenant(req).companyId;
      const brs_id = String(req.params.brs_id);
      const { ledger_entry_id, statement_entry_id } = req.body;
      const result = await brsService.matchItem(company_id, brs_id, ledger_entry_id, statement_entry_id);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  },

  async getReconciliationStatus(req: Request, res: Response) {
    try {
      const company_id = requireTenant(req).companyId;
      const id = String(req.params.id);
      const status = await brsService.getStatus(company_id, id);
      res.json(status);
    } catch (e: any) {
      res.status(404).json({ error: e.message });
    }
  },
};
