import { requireTenant } from '@/common/middleware/require-tenant';
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { LedgerService } from '../services/ledger.service';
import { LedgerRepository } from '../repositories/ledger.repository';

const prisma = new PrismaClient();
const ledgerService = new LedgerService(new LedgerRepository(prisma), prisma);

export const LedgerController = {
  async getLedger(req: Request, res: Response) {
    const { account_id, from_date, to_date, party_id } = req.query;
    const entries = await ledgerService.getLedgerByAccount(
      String(account_id),
      from_date ? new Date(String(from_date)) : undefined,
      to_date ? new Date(String(to_date)) : undefined,
      party_id ? String(party_id) : undefined
    );
    res.json(entries);
  },

  async getAccountBalance(req: Request, res: Response) {
    const { account_id, as_of_date } = req.query;
    const balance = await ledgerService.getAccountBalance(
      String(account_id),
      as_of_date ? new Date(String(as_of_date)) : undefined
    );
    res.json({ account_id, balance });
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
