import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/common/config/env-config';
import { requireTenant } from '@/common/middleware/require-tenant';
import { AppError } from '@/common/errors/error-classes';

/**
 * M10 — Voucher controller
 *
 * 2026-09-04: यहाँ पाँच जगह company की सीमा थी ही नहीं। यह लेखा-जोखा का हिस्सा है,
 * इसलिए हर छेद सीधे पैसों के रिकॉर्ड पर असर डालता था:
 *
 *   • getVouchers  — `company_id` **query string से** लेता था। यानी कोई भी अपनी
 *     request में दूसरी company की id डालकर उनकी सारी vouchers पढ़ सकता था।
 *   • createVoucher — `...voucherData` सीधे req.body से फैलाया जाता था, इसलिए body
 *     में दूसरी company की id भेजकर उनके खाते में voucher बनाई जा सकती थी।
 *   • getVoucherById / postVoucher / cancelVoucher — सिर्फ़ URL की id पर चलते थे।
 *     यानी दूसरी company की voucher पढ़ी, **उनके ledger में चढ़ाई**, और **रद्द**
 *     की जा सकती थी।
 *
 * अब company हमेशा **token से** आती है (`requireTenant`), request से कभी नहीं —
 * क्योंकि request वही भेजता है जिसे रोकना है। दूसरी company की चीज़ पर 404 मिलेगा,
 * 403 नहीं, ताकि जवाब से यह भी न पता चले कि वो id मौजूद है।
 *
 * `new PrismaClient()` भी हटाया — हर controller अपना client बनाएगा तो connection
 * pool कई गुना खुल जाएगा; अब साझा वाला इस्तेमाल होता है।
 */
export const VoucherController = {
  async createVoucher(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = requireTenant(req).companyId;
      const { items, company_id: _ignored, ...voucherData } = req.body;

      if (!Array.isArray(items) || items.length === 0) {
        throw new AppError('GNT-ERR-1001', 'Voucher में कम से कम एक entry चाहिए', 400);
      }

      const totalDebit = items.reduce((sum: number, i: { debit_amount?: number }) => sum + (i.debit_amount || 0), 0);
      const totalCredit = items.reduce((sum: number, i: { credit_amount?: number }) => sum + (i.credit_amount || 0), 0);

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        throw new AppError('GNT-ERR-1002', 'Debit and credit totals must be equal', 400);
      }

      // 2026-09-04: `voucher_date` JSON में हमेशा string होता है ("2024-04-01"), और
      // Prisma को DateTime चाहिए। पहले पूरा body सीधे आगे बढ़ा दिया जाता था, इसलिए
      // हर असली API call यहीं फट जाती थी — यानी **API से voucher बनाना कभी चला ही नहीं**।
      // पुराना test इसे नहीं पकड़ पाया क्योंकि वो सिर्फ़ "गड़बड़ी वाला" रास्ता जाँचता था
      // (debit≠credit → 400), सही रास्ता कभी चलाया ही नहीं।
      const { voucher_date, ...baaki } = voucherData;
      const voucherDate = new Date(voucher_date);
      if (Number.isNaN(voucherDate.getTime())) {
        throw new AppError('GNT-ERR-1006', 'voucher_date सही तारीख़ नहीं है', 400);
      }

      const voucher = await prisma.voucher.create({
        data: {
          ...baaki,
          voucher_date: voucherDate,
          company_id: companyId, // हमेशा token से — body की id जान-बूझकर ऊपर हटा दी
          total_debit: totalDebit,
          total_credit: totalCredit,
          items: { create: items },
        },
        include: { items: true },
      });
      res.status(201).json(voucher);
    } catch (err) { next(err); }
  },

  async getVouchers(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = requireTenant(req).companyId;
      const { type, from_date, to_date } = req.query;

      const vouchers = await prisma.voucher.findMany({
        where: {
          company_id: companyId, // query string से नहीं — वहीं छेद था
          ...(type ? { voucher_type: String(type) } : {}),
          ...(from_date && to_date
            ? { voucher_date: { gte: new Date(String(from_date)), lte: new Date(String(to_date)) } }
            : {}),
        },
        include: { items: true },
        orderBy: { voucher_date: 'desc' },
      });
      res.json(vouchers);
    } catch (err) { next(err); }
  },

  async getVoucherById(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = requireTenant(req).companyId;
      const voucher = await prisma.voucher.findFirst({
        where: { id: String(req.params.id), company_id: companyId },
        include: { items: true },
      });
      if (!voucher) throw new AppError('GNT-ERR-1003', 'Voucher not found', 404);
      res.json(voucher);
    } catch (err) { next(err); }
  },

  async postVoucher(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = requireTenant(req).companyId;
      const voucher = await prisma.voucher.findFirst({
        where: { id: String(req.params.id), company_id: companyId },
        include: { items: true },
      });
      if (!voucher) throw new AppError('GNT-ERR-1003', 'Voucher not found', 404);
      if (voucher.status !== 'draft') {
        throw new AppError('GNT-ERR-1004', 'Voucher already posted or cancelled', 400);
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
          // खाते का balance भी company से बँधा — वरना दूसरी company का खाता हिल सकता था
          const touched = await tx.account_master.updateMany({
            where: { id: item.account_id, company_id: companyId },
            data: {
              current_balance: {
                increment: Number(item.debit_amount) - Number(item.credit_amount),
              },
            },
          });
          if (touched.count === 0) {
            throw new AppError('GNT-ERR-1005', 'Account इस company का नहीं है', 404);
          }
        }
        await tx.voucher.update({ where: { id: voucher.id }, data: { status: 'posted' } });
      });

      res.json({ message: 'Voucher posted successfully' });
    } catch (err) { next(err); }
  },

  async cancelVoucher(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = requireTenant(req).companyId;
      const done = await prisma.voucher.updateMany({
        where: { id: String(req.params.id), company_id: companyId },
        data: { status: 'cancelled' },
      });
      if (done.count === 0) throw new AppError('GNT-ERR-1003', 'Voucher not found', 404);
      res.json({ message: 'Voucher cancelled' });
    } catch (err) { next(err); }
  },
};
