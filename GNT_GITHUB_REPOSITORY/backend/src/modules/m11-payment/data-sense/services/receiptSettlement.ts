// ============================================================================
// Data Sense — बैंक receipt को customer के बकाया बिल में लगाने की core logic।
//
// दो जगह से बुलाई जाती है:
//  1. transfer.executor — import के वक़्त (owner फ़ैसला #3 Option B)
//  2. paymentHold.service — on-hold row को owner के resolve करने पर
//
// उद्योग-मानक "Apply to Oldest" (FIFO): साफ़ payment अपने-आप सबसे पुराने
// approved/posted बिल में adjust; बची रक़म advance allocation में।
//
// GNT कभी अपने-आप बकाया **close/write-off नहीं** करता — यह सिर्फ़ असली मिली
// रक़म को बिल से मिलाता है (paid/partial), और उतना ही जितना amountPaid बढ़ा।
// जिस बकाया के सामने कोई receipt नहीं आई वो हमेशा 'unpaid' (Open) रहता है।
//
// जान-बूझकर दायरे से बाहर: इस import path से M10 में ताज़ा voucher नहीं बनता
// (migrated opening balances के साथ double-count से बचने के लिए)। M11 का
// settlement record + balanced M11 audit ledger बनता है; M08 invoice balance अपडेट।
// ============================================================================

import { createHash, randomBytes } from 'node:crypto';
import { prisma } from '@/common/config/prisma';
import { LedgerRepository } from '@/modules/m11-payment/repositories/ledger.repository';
import { Decimal } from '@prisma/client/runtime/library';

export const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

export function buildReceiptKey(
  companyId: string,
  customerId: string,
  amount: number,
  valueDate: Date,
  narration: string
): string {
  return `DS-${createHash('sha256')
    .update(
      `${companyId}|${customerId}|${amount.toFixed(2)}|${valueDate.toISOString().slice(0, 10)}|${narration}`
    )
    .digest('hex')
    .slice(0, 48)}`;
}

// नाम से एक ही customer — substring/GST/phone match नहीं, बस tenant-scoped exact नाम।
// 0 या 1 से ज़्यादा मिले → null (row on-hold में जाएगी, गलत party पर पैसा नहीं लगेगा)।
export async function findExactCustomer(
  companyId: string,
  name: string
): Promise<{ id: string; name: string } | null> {
  const hits = await prisma.party_master.findMany({
    where: {
      company_id: companyId,
      is_active: true,
      party_type: { in: ['customer', 'both'] },
      name: { equals: name, mode: 'insensitive' },
    },
    select: { id: true, name: true },
    take: 2,
  });
  return hits.length === 1 ? hits[0] : null;
}

// बैंक-receipt के लिए tenant की BANK_TRANSFER विधि (कोई भी active नहीं)। न मिले तो बना दो।
export async function getOrCreateBankTransferMethod(
  companyId: string,
  userId: string
): Promise<string> {
  const existing = await prisma.paymentMethod.findFirst({
    where: { tenantId: companyId, code: 'BANK_TRANSFER' },
  });
  if (existing) return existing.id;
  try {
    const created = await prisma.paymentMethod.create({
      data: {
        code: 'BANK_TRANSFER',
        name: 'Bank Transfer',
        tenantId: companyId,
        createdBy: userId,
        updatedBy: userId,
      },
    });
    return created.id;
  } catch {
    const again = await prisma.paymentMethod.findFirst({
      where: { tenantId: companyId, code: 'BANK_TRANSFER' },
    });
    if (again) return again.id;
    throw new Error('BANK_TRANSFER payment method नहीं बन सका');
  }
}

export interface ApplyReceiptInput {
  companyId: string;
  userId: string;
  customerId: string;
  customerName: string;
  amount: number; // already round2'd, > 0
  valueDate: Date;
  narration: string;
  /** दोबारा-import रोकने की key; न दो तो generate होगी */
  receiptKey?: string;
  /** report/txn number के लिए source hint */
  rowRef?: string | number;
}

export interface ApplyReceiptResult {
  status: 'applied' | 'duplicate' | 'no-open-invoice';
  txnId?: string;
  txnNumber?: string;
  settled: number;
  advance: number;
  invoiceCount: number;
  note: string;
}

/**
 * receipt को customer के open बिल में FIFO लगाओ।
 *  • duplicate (वही receiptKey पहले से) → कुछ नहीं, status 'duplicate'
 *  • कोई open बिल नहीं → कुछ नहीं, status 'no-open-invoice' (caller इसे hold में डाले)
 *  • वरना → PaymentTransaction + allocations + balanced M11 ledger, M08 balances अपडेट
 */
export async function applyReceiptFifo(input: ApplyReceiptInput): Promise<ApplyReceiptResult> {
  const { companyId, userId, customerId, customerName, amount, valueDate, narration } = input;
  const receiptKey =
    input.receiptKey ?? buildReceiptKey(companyId, customerId, amount, valueDate, narration);

  const dup = await prisma.paymentTransaction.findFirst({
    where: { tenantId: companyId, providerRef: receiptKey },
    select: { transactionNumber: true },
  });
  if (dup) {
    return {
      status: 'duplicate',
      settled: 0,
      advance: 0,
      invoiceCount: 0,
      note: `यह receipt पहले लग चुकी (txn ${dup.transactionNumber})`,
    };
  }

  const methodId = await getOrCreateBankTransferMethod(companyId, userId);
  const txnNumber = `TXN-${Date.now()}-${input.rowRef ?? 'x'}-${randomBytes(3).toString('hex')}`;

  const outcome = await prisma.$transaction(async (tx) => {
    const open = await tx.salesInvoice.findMany({
      where: {
        companyId,
        customerId,
        status: { in: ['approved', 'posted'] },
        paymentStatus: { in: ['unpaid', 'partial'] },
      },
      orderBy: [{ invoiceDate: 'asc' }, { invoiceNumber: 'asc' }],
    });

    let remaining = amount;
    const allocations: Array<{
      targetType: string;
      targetId: string;
      targetNumber: string | null;
      allocatedAmount: number;
      isFullPayment: boolean;
    }> = [];

    for (const inv of open) {
      if (remaining <= 0.00001) break;
      const grand = Number(inv.grandTotal);
      const already = Number(inv.amountPaid);
      const balance = round2(grand - already);
      if (balance <= 0) continue;
      const alloc = round2(Math.min(remaining, balance));
      const newPaid = round2(already + alloc);
      const full = newPaid >= grand - 0.00001;
      // conditional — बीच में कोई और payment इसी invoice पर लगा दे तो count 0 → rollback
      const upd = await tx.salesInvoice.updateMany({
        where: { id: inv.id, amountPaid: inv.amountPaid },
        data: { amountPaid: newPaid, paymentStatus: full ? 'paid' : 'partial' },
      });
      if (upd.count !== 1) {
        throw new Error(`invoice ${inv.invoiceNumber} बीच में बदल गई — दोबारा चलाएँ`);
      }
      remaining = round2(remaining - alloc);
      allocations.push({
        targetType: 'INVOICE',
        targetId: inv.id,
        targetNumber: inv.invoiceNumber,
        allocatedAmount: alloc,
        isFullPayment: full,
      });
    }

    if (allocations.length === 0) {
      return { txnId: null as string | null, settled: 0, advance: 0, invoiceCount: 0 };
    }

    // बची रक़म — पूरा receipt record हो, इसलिए advance allocation
    if (remaining > 0.00001) {
      allocations.push({
        targetType: 'ACCOUNT',
        targetId: customerId,
        targetNumber: null,
        allocatedAmount: remaining,
        isFullPayment: false,
      });
    }

    const txn = await tx.paymentTransaction.create({
      data: {
        transactionNumber: txnNumber,
        partyType: 'CUSTOMER',
        partyId: customerId,
        partyName: customerName,
        amount,
        baseAmount: amount,
        direction: 'IN',
        status: 'COMPLETED',
        paymentMethodId: methodId,
        referenceType: 'INVOICE',
        referenceId: allocations[0].targetId,
        referenceNumber:
          allocations
            .filter((a) => a.targetNumber)
            .map((a) => a.targetNumber)
            .join(', ') || null,
        providerRef: receiptKey,
        narration,
        transactionDate: valueDate,
        valueDate,
        settledAt: new Date(),
        createdBy: userId,
        updatedBy: userId,
        tenantId: companyId,
      },
    });
    for (const a of allocations) {
      await tx.paymentAllocation.create({
        data: {
          transactionId: txn.id,
          targetType: a.targetType,
          targetId: a.targetId,
          targetNumber: a.targetNumber,
          allocatedAmount: a.allocatedAmount,
          isFullPayment: a.isFullPayment,
          tenantId: companyId,
        },
      });
    }
    await new LedgerRepository(tx).create(
      [
        {
          transactionId: txn.id,
          accountCode: 'CASH_BANK',
          debitAmount: new Decimal(amount),
          creditAmount: new Decimal(0),
          narration: `Receipt ${txnNumber}`,
          entryDate: valueDate,
        },
        {
          transactionId: txn.id,
          accountCode: 'ACCOUNTS_RECEIVABLE',
          debitAmount: new Decimal(0),
          creditAmount: new Decimal(amount),
          narration: `Receipt ${txnNumber}`,
          entryDate: valueDate,
        },
      ],
      companyId,
      userId
    );

    return {
      txnId: txn.id as string | null,
      settled: round2(amount - remaining),
      advance: remaining,
      invoiceCount: allocations.filter((a) => a.targetType === 'INVOICE').length,
    };
  });

  if (!outcome.txnId) {
    return {
      status: 'no-open-invoice',
      settled: 0,
      advance: 0,
      invoiceCount: 0,
      note: `'${customerName}' का कोई बकाया approved/posted बिल नहीं`,
    };
  }
  return {
    status: 'applied',
    txnId: outcome.txnId,
    txnNumber,
    settled: outcome.settled,
    advance: outcome.advance,
    invoiceCount: outcome.invoiceCount,
    note:
      outcome.advance > 0.00001
        ? `${outcome.invoiceCount} बिल में ₹${outcome.settled.toFixed(2)}; ₹${outcome.advance.toFixed(2)} advance जमा`
        : `${outcome.invoiceCount} बिल पूरे/आंशिक चुकता`,
  };
}
