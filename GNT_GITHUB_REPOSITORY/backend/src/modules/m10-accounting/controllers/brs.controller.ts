import { Request, Response } from 'express';
import { BRSService } from '../services/brs.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const brsService = new BRSService(prisma);

export const BRSController = {
  async createBRS(req: Request, res: Response) {
    try {
      const brs = await brsService.createBRS(req.body);
      res.status(201).json(brs);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  },

  async getBRSList(req: Request, res: Response) {
    const { company_id, bank_account_id } = req.query;
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
      const { brs_id } = req.params;
      const { ledger_entry_id, statement_entry_id } = req.body;
      const result = await brsService.matchItem(brs_id, ledger_entry_id, statement_entry_id);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  },

  async getReconciliationStatus(req: Request, res: Response) {
    const { id } = req.params;
    const status = await brsService.getStatus(id);
    res.json(status);
  },
};
