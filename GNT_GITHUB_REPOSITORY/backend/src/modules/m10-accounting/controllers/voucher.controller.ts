import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const VoucherController = {
  async createVoucher(req: Request, res: Response) {
    const { items, ...voucherData } = req.body;
    const totalDebit = items.reduce((sum: number, i: any) => sum + (i.debit_amount || 0), 0);
    const totalCredit = items.reduce((sum: number, i: any) => sum + (i.credit_amount || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return res.status(400).json({ error: 'Debit and credit totals must be equal' });
    }

    const voucher = await prisma.voucher.create({
      data: {
        ...voucherData,
        total_debit: totalDebit,
        total_credit: totalCredit,
        items: { create: items },
      },
      include: { items: true },
    });
    res.status(201).json(voucher);
  },

  async getVouchers(req: Request, res: Response) {
    const { company_id, type, from_date, to_date } = req.query;
    const vouchers = await prisma.voucher.findMany({
      where: {
        company_id: String(company_id),
        ...(type ? { voucher_type: String(type) } : {}),
        ...(from_date && to_date ? { voucher_date: { gte: new Date(String(from_date)), lte: new Date(String(to_date)) } } : {}),
      },
      include: { items: true },
      orderBy: { voucher_date: 'desc' },
    });
    res.json(vouchers);
  },

  async getVoucherById(req: Request, res: Response) {
    const voucher = await prisma.voucher.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });
    if (!voucher) return res.status(404).json({ error: 'Not found' });
    res.json(voucher);
  },

  async postVoucher(req: Request, res: Response) {
    const voucher = await prisma.voucher.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });
    if (!voucher || voucher.status !== 'draft') {
      return res.status(400).json({ error: 'Voucher not found or already posted' });
    }

    await prisma.$transaction(async (tx) => {
      for (const item of voucher.items) {
        await tx.ledger.create({
          data: {
            company_id: voucher.company_id,
            branch_id: voucher.branch_id,
            voucher_id: voucher.id,
            account_id: item.account_id,
            transaction_date: voucher.voucher_date,
            narration: item.narration || voucher.narration,
            debit_amount: item.debit_amount,
            credit_amount: item.credit_amount,
            party_id: item.party_id,
            created_by: voucher.created_by,
          },
        });
        await tx.account_master.update({
          where: { id: item.account_id },
          data: {
            current_balance: {
              increment: Number(item.debit_amount) - Number(item.credit_amount),
            },
          },
        });
      }
      await tx.voucher.update({
        where: { id: voucher.id },
        data: { status: 'posted' },
      });
    });

    res.json({ message: 'Voucher posted successfully' });
  },

  async cancelVoucher(req: Request, res: Response) {
    await prisma.voucher.update({
      where: { id: req.params.id },
      data: { status: 'cancelled' },
    });
    res.json({ message: 'Voucher cancelled' });
  },
};
