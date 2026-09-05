// M11 Payment Module — M10 Accounting से असली wiring
//
// पहले payment.service.ts अपनी ही private `PaymentLedgerEntry` table में
// hardcoded account codes ('CASH_BANK', 'SALES_REVENUE') के साथ लिखता था —
// टिप्पणी में "M10 Finance integration" लिखा था, पर असल में M10 के असली
// `ledger`/`account_master` (trial balance, P&L, balance sheet जो पढ़ते हैं)
// को कभी छुआ ही नहीं जाता था। यानी असली किताबों में payment कभी दिखता ही नहीं था।
//
// यह file वही असली पुल है: M10 की सार्वजनिक VoucherService बुलाती है
// (createPaymentVoucher — मालिक का voucher design, पहले से M10 में मौजूद)।
// M11 के bank account/party-type से M10 के असली account_master खाते ढूँढती/
// बनाती है (चार्ट-ऑफ़-अकाउंट्स का कोई नया फ़ैसला नहीं — सिर्फ़ deterministic
// lookup-or-create, standard control-account पैटर्न)।

import { PrismaClient } from '@prisma/client';
import { VoucherService, VoucherServiceError, type ReferenceType as M10ReferenceType } from '@/modules/m10-accounting/services/voucher.service';
import { partyService } from '@/modules/m05-party-management/services/party.service';
import { AppError } from '@/common/errors/error-classes';

export type NormalizedPartyType = 'CUSTOMER' | 'VENDOR' | 'EMPLOYEE' | 'SYSTEM';

/** payerType कहीं से भी आए (frontend 'customer'/'supplier' भेजता है, DB का enum 'CUSTOMER'/'VENDOR' है) — एक ही जगह सामान्य करें */
export function normalizePartyType(raw: string | undefined | null): NormalizedPartyType {
  const v = (raw || '').toUpperCase();
  if (v === 'CUSTOMER') return 'CUSTOMER';
  if (v === 'VENDOR' || v === 'SUPPLIER') return 'VENDOR';
  if (v === 'EMPLOYEE') return 'EMPLOYEE';
  return 'SYSTEM';
}

/** customer से पैसा आया = IN (receipt) · vendor/employee/system को/के लिए गया = OUT (payment) */
export function directionForPartyType(partyType: NormalizedPartyType): 'IN' | 'OUT' {
  return partyType === 'CUSTOMER' ? 'IN' : 'OUT';
}

export class LedgerBridgeService {
  private voucherService: VoucherService;

  constructor(private prisma: PrismaClient) {
    this.voucherService = new VoucherService(prisma);
  }

  /** M05 की असली party — सिर्फ़ CUSTOMER/VENDOR के लिए (EMPLOYEE M12 का, SYSTEM का कोई party नहीं) */
  async assertPartyExists(companyId: string, partyType: NormalizedPartyType, partyId: string): Promise<void> {
    if (partyType !== 'CUSTOMER' && partyType !== 'VENDOR') return;
    const party = partyType === 'CUSTOMER'
      ? await partyService.getCustomerById(partyId, companyId)
      : await partyService.getSupplierById(partyId, companyId);
    if (!party) {
      throw new AppError('PARTY_NOT_FOUND', `${partyType === 'CUSTOMER' ? 'Customer' : 'Supplier'} not found for this company`, 400);
    }
  }

  /** M11 के bank account के लिए M10 का असली GL खाता — न मिले तो बनाओ (deterministic code, कोई नया चार्ट-ऑफ़-अकाउंट्स फ़ैसला नहीं) */
  private async resolveBankLedgerAccount(companyId: string, bankAccountId: string): Promise<string> {
    const bank = await this.prisma.bankAccount.findFirst({ where: { id: bankAccountId, tenantId: companyId } });
    if (!bank) throw new AppError('BANK_ACCOUNT_NOT_FOUND', 'Bank account not found for this company', 400);

    const code = `M11-BANK-${bank.accountCode}`;
    const existing = await this.prisma.account_master.findFirst({ where: { company_id: companyId, code } });
    if (existing) return existing.id;

    const created = await this.prisma.account_master.create({
      data: {
        company_id: companyId,
        name: bank.accountName,
        code,
        type: 'asset',
        is_bank_account: true,
        bank_name: bank.bankName,
        bank_account_no: bank.accountNumber,
      },
    });
    return created.id;
  }

  /** company-वार control account — Sundry Debtors (customer) / Sundry Creditors (vendor) */
  private async resolvePartyControlAccount(companyId: string, partyType: 'CUSTOMER' | 'VENDOR'): Promise<string> {
    const isCustomer = partyType === 'CUSTOMER';
    const code = `M11-${isCustomer ? 'AR' : 'AP'}-${companyId}`;
    const existing = await this.prisma.account_master.findFirst({ where: { company_id: companyId, code } });
    if (existing) return existing.id;

    const created = await this.prisma.account_master.create({
      data: {
        company_id: companyId,
        name: isCustomer ? 'Sundry Debtors' : 'Sundry Creditors',
        code,
        type: isCustomer ? 'asset' : 'liability',
      },
    });
    return created.id;
  }

  /** M11 का referenceType ('INVOICE'/'BILL') → M10 का ReferenceType */
  private toM10ReferenceType(referenceType: string | null): M10ReferenceType | null {
    if (referenceType === 'INVOICE') return 'SALES_INVOICE';
    if (referenceType === 'BILL') return 'PURCHASE_INVOICE';
    return null;
  }

  /**
   * payment COMPLETED होते ही M10 में असली voucher + ledger + allocation +
   * (SALES_INVOICE के लिए) invoice.amountPaid/paymentStatus — सब एक साथ।
   *
   * सिर्फ़ तभी चलता है जब partyType CUSTOMER/VENDOR हो और referenceType/Id
   * किसी बिल की तरफ़ इशारा करे (INVOICE/BILL) — PAYROLL/ORDER/JOURNAL या बिना
   * referenceId वाले payments (EMPLOYEE/SYSTEM) के लिए M10 की createPaymentVoucher
   * के पास "किस बिल पर" allocate करने को कुछ नहीं होता (वहाँ कम से कम एक allocation
   * ज़रूरी है) — वहाँ जान-बूझकर skip होता है, चुपचाप ग़लत allocate करने से बेहतर।
   */
  async postPaymentToLedger(params: {
    companyId: string;
    userId: string;
    partyType: NormalizedPartyType;
    partyId: string;
    amount: number;
    bankAccountId: string | null;
    referenceType: string | null;
    referenceId: string | null;
    narration?: string | null;
    voucherDate: Date;
  }): Promise<{ posted: true; voucherId: string } | { posted: false; reason: string }> {
    const { companyId, userId, partyType, partyId, amount, bankAccountId, referenceType, referenceId, narration, voucherDate } = params;

    if (partyType !== 'CUSTOMER' && partyType !== 'VENDOR') {
      return { posted: false, reason: `partyType ${partyType} के लिए बिल-आधारित voucher नहीं बनता` };
    }
    const m10RefType = this.toM10ReferenceType(referenceType);
    if (!m10RefType || !referenceId) {
      return { posted: false, reason: 'कोई invoice/bill reference नहीं — allocate करने को कुछ नहीं' };
    }
    if (!bankAccountId) {
      return { posted: false, reason: 'कोई bank account लिंक नहीं — GL खाता तय नहीं हो सकता' };
    }

    const bankAccountLedgerId = await this.resolveBankLedgerAccount(companyId, bankAccountId);
    const partyAccountId = await this.resolvePartyControlAccount(companyId, partyType);

    try {
      const voucher = await this.voucherService.createPaymentVoucher({
        companyId,
        partyId,
        voucherType: partyType === 'CUSTOMER' ? 'receipt' : 'payment',
        voucherDate,
        bankOrCashAccountId: bankAccountLedgerId,
        partyAccountId,
        amount,
        allocations: [{ reference_type: m10RefType, reference_id: referenceId, allocated_amount: amount }],
        narration: narration || undefined,
        createdBy: userId,
      });
      return { posted: true, voucherId: (voucher as { id: string }).id };
    } catch (err) {
      if (err instanceof VoucherServiceError) {
        throw new AppError(`M10_${err.code}`, err.message, 400);
      }
      throw err;
    }
  }
}
