import { requireTenant } from '@/common/middleware/require-tenant';
import { Router } from 'express';
import { prisma } from '@/common/config/prisma';
import { LedgerController } from '../controllers/ledger.controller';
import { VoucherController } from '../controllers/voucher.controller';
import { BRSController } from '../controllers/brs.controller';

const router = Router();

// 2026-09-05 tenant fix: `data: req.body` सीधे Prisma में जा रहा था — यानी कोई भी
// अपनी request में दूसरी कंपनी का `company_id` डालकर उनके खातों में नया खाता बना
// सकता था। अब company token से आती है और body से आया company_id माना ही नहीं जाता।
router.post('/accounts', async (req, res) => {
  const company_id = requireTenant(req).companyId;
  const { name, code, type, subtype, parent_id, opening_balance, is_bank_account, bank_name, bank_account_no } = req.body ?? {};
  if (!name || !code || !type) {
    return res.status(400).json({ success: false, error: 'ACCOUNT_FIELDS_REQUIRED', message: 'name, code और type ज़रूरी हैं' });
  }
  const acc = await prisma.account_master.create({
    data: {
      company_id,
      name: String(name),
      code: String(code),
      type: String(type),
      ...(subtype ? { subtype: String(subtype) } : {}),
      ...(parent_id ? { parent_id: String(parent_id) } : {}),
      ...(opening_balance !== undefined ? { opening_balance } : {}),
      ...(is_bank_account !== undefined ? { is_bank_account: Boolean(is_bank_account) } : {}),
      ...(bank_name ? { bank_name: String(bank_name) } : {}),
      ...(bank_account_no ? { bank_account_no: String(bank_account_no) } : {}),
    },
  });
  res.status(201).json(acc);
});

router.get('/accounts', async (req, res) => {
  // 2026-09-04 tenant fix: company token से, query string से नहीं
  const company_id = requireTenant(req).companyId;
  const { type, search } = req.query;
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

// मालिक का हार्ड रूल — party-वार खाता-बही (दो parties का डेटा कभी एक साथ नहीं)
router.get('/party-ledger', LedgerController.getPartyLedger);
router.get('/party-ledger/balance', LedgerController.getPartyBalance);

router.post('/vouchers', VoucherController.createVoucher);
router.get('/vouchers', VoucherController.getVouchers);
router.get('/vouchers/:id', VoucherController.getVoucherById);
router.post('/vouchers/:id/post', VoucherController.postVoucher);
router.post('/vouchers/:id/cancel', VoucherController.cancelVoucher);

// मालिक का design — payment/receipt की voucher, और बकाया का हिसाब
router.post('/vouchers/payment', VoucherController.createPaymentVoucher);
router.get('/vouchers/outstanding', VoucherController.getBillOutstanding);
router.get('/party-outstanding', VoucherController.getPartyOutstanding);

router.get('/trial-balance', LedgerController.getTrialBalance);
router.get('/profit-loss', LedgerController.getProfitLoss);
router.get('/balance-sheet', LedgerController.getBalanceSheet);

// पहले BRSController कहीं किसी route से जुड़ा ही नहीं था — पूरी bank
// reconciliation feature (create/list/match/status, चारों लिखी और आंशिक रूप से
// tested) किसी request तक पहुँचती ही नहीं थी।
router.post('/brs', BRSController.createBRS);
router.get('/brs', BRSController.getBRSList);
router.post('/brs/:brs_id/match', BRSController.reconcileItem);
router.get('/brs/:id/status', BRSController.getReconciliationStatus);

export default router;
