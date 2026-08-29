import { Router } from 'express';
import { LedgerController } from '../controllers/ledger.controller';
import { VoucherController } from '../controllers/voucher.controller';

const router = Router();

router.post('/accounts', async (req, res) => {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  const acc = await prisma.account_master.create({ data: req.body });
  res.status(201).json(acc);
});

router.get('/accounts', async (req, res) => {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  const { company_id, type, search } = req.query;
  const accounts = await prisma.account_master.findMany({
    where: {
      company_id: String(company_id),
      ...(type ? { type: String(type) } : {}),
      ...(search ? { name: { contains: String(search), mode: 'insensitive' } } : {}),
    },
  });
  res.json(accounts);
});

router.get('/ledger', LedgerController.getLedger);
router.get('/ledger/balance', LedgerController.getAccountBalance);

router.post('/vouchers', VoucherController.createVoucher);
router.get('/vouchers', VoucherController.getVouchers);
router.get('/vouchers/:id', VoucherController.getVoucherById);
router.post('/vouchers/:id/post', VoucherController.postVoucher);
router.post('/vouchers/:id/cancel', VoucherController.cancelVoucher);

router.get('/trial-balance', LedgerController.getTrialBalance);
router.get('/profit-loss', LedgerController.getProfitLoss);
router.get('/balance-sheet', LedgerController.getBalanceSheet);

export default router;
