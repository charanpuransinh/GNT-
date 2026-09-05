import { requireTenant } from '@/common/middleware/require-tenant';
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { LedgerService } from '../services/ledger.service';
import { LedgerRepository } from '../repositories/ledger.repository';

const prisma = new PrismaClient();
const ledgerService = new LedgerService(new LedgerRepository(prisma), prisma);

export const LedgerController = {
  // 2026-09-05 tenant fix: यह दोनों रह गए थे — सिर्फ़ account_id जानकर कोई भी दूसरी
  // कंपनी की खाता-बही और बैलेंस पढ़ सकता था। अब company token से आती है।
  async getLedger(req: Request, res: Response) {
    const company_id = requireTenant(req).companyId;
    const { account_id, from_date, to_date, party_id } = req.query;
    const entries = await ledgerService.getLedgerByAccount(
      company_id,
      String(account_id),
      from_date ? new Date(String(from_date)) : undefined,
      to_date ? new Date(String(to_date)) : undefined,
      party_id ? String(party_id) : undefined
    );
    res.json(entries);
  },

  async getAccountBalance(req: Request, res: Response) {
    const company_id = requireTenant(req).companyId;
    const { account_id, as_of_date } = req.query;
    const balance = await ledgerService.getAccountBalance(
      company_id,
      String(account_id),
      as_of_date ? new Date(String(as_of_date)) : undefined
    );
    res.json({ account_id, balance });
  },

  // ── मालिक का हार्ड रूल (2026-09-05) ─────────────────────────────────────
  // "हर party का ledger, बैलेंस, transaction history पूरी तरह अपने आप में
  // self-contained रहेगा।" इसलिए ये दो रास्ते party से बँधे हैं, खाते से नहीं —
  // party_id के बिना ये कुछ लौटाते ही नहीं (400), ताकि गलती से दो parties का
  // डेटा एक साथ न निकल जाए।
  async getPartyLedger(req: Request, res: Response) {
    const company_id = requireTenant(req).companyId;
    const { party_id, from_date, to_date } = req.query;
    if (!party_id) {
      return res.status(400).json({ success: false, error: 'PARTY_ID_REQUIRED', message: 'party_id ज़रूरी है' });
    }
    const entries = await ledgerService.getPartyLedger(
      company_id,
      String(party_id),
      from_date ? new Date(String(from_date)) : undefined,
      to_date ? new Date(String(to_date)) : undefined
    );
    res.json(entries);
  },

  async getPartyBalance(req: Request, res: Response) {
    const company_id = requireTenant(req).companyId;
    const { party_id, as_of_date } = req.query;
    if (!party_id) {
      return res.status(400).json({ success: false, error: 'PARTY_ID_REQUIRED', message: 'party_id ज़रूरी है' });
    }
    const balance = await ledgerService.getPartyBalance(
      company_id,
      String(party_id),
      as_of_date ? new Date(String(as_of_date)) : undefined
    );
    res.json({ party_id, balance });
  },

  async getTrialBalance(req: Request, res: Response) {
    // 2026-09-04 tenant fix: company अब token से (requireTenant), query string से नहीं —
    // पहले कोई भी अपनी request में दूसरी company की id डालकर उनका लेखा-जोखा पढ़ सकता था।
    const company_id = requireTenant(req).companyId;
    const { as_of_date } = req.query;
    const tb = await ledgerService.getTrialBalance(
      String(company_id),
      as_of_date ? new Date(String(as_of_date)) : undefined
    );
    res.json(tb);
  },

  async getProfitLoss(req: Request, res: Response) {
    // 2026-09-04 tenant fix: company अब token से (requireTenant), query string से नहीं —
    // पहले कोई भी अपनी request में दूसरी company की id डालकर उनका लेखा-जोखा पढ़ सकता था।
    const company_id = requireTenant(req).companyId;
    const { from_date, to_date } = req.query;
    const pl = await ledgerService.getProfitLoss(
      String(company_id),
      new Date(String(from_date)),
      new Date(String(to_date))
    );
    res.json(pl);
  },

  async getBalanceSheet(req: Request, res: Response) {
    // 2026-09-04 tenant fix: company अब token से (requireTenant), query string से नहीं —
    // पहले कोई भी अपनी request में दूसरी company की id डालकर उनका लेखा-जोखा पढ़ सकता था।
    const company_id = requireTenant(req).companyId;
    const { as_of_date } = req.query;
    const bs = await ledgerService.getBalanceSheet(
      String(company_id),
      new Date(String(as_of_date))
    );
    res.json(bs);
  },
};
