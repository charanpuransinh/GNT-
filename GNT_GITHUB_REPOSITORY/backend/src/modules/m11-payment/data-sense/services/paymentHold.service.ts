// ============================================================================
// Data Sense — बैंक-receipt "on-hold" सूची (owner फ़ैसला 2026-09-09)।
//
// यहाँ वो receipt पंक्तियाँ आती हैं जिन्हें GNT अपने-आप apply नहीं करता:
//   CUSTOMER_NOT_FOUND  — नाम से कोई customer नहीं मिला
//   AMBIGUOUS_PARTY     — उसी नाम के एक से ज़्यादा customer
//   NO_OPEN_INVOICE     — customer तो मिला पर कोई बकाया approved/posted बिल नहीं
//   DOUBTFUL / DISPUTED — फ़ाइल/owner ने shak़ी मार्क किया
//
// यह सूची रोज़ के popup में नहीं आती — owner जब चाहे `GET .../on-hold` देखकर हर
// row पर फ़ैसला ले: apply-fifo (सबसे पुराने बिल में लगाओ) या discard (छोड़ दो)।
// कुछ न करे तो row OPEN ही रहती है। GNT यहाँ से कभी अपने-आप कुछ apply नहीं करता।
// ============================================================================

import { prisma } from '@/common/config/prisma';
import { AppError } from '@/common/errors/error-classes';
import { applyReceiptFifo, round2 } from './receiptSettlement';

export type HoldReason =
  | 'CUSTOMER_NOT_FOUND'
  | 'AMBIGUOUS_PARTY'
  | 'NO_OPEN_INVOICE'
  | 'DOUBTFUL'
  | 'DISPUTED';

export interface CreateHoldInput {
  companyId: string;
  userId: string;
  partyNameRaw: string;
  resolvedPartyId?: string | null;
  amount: number;
  valueDate: Date;
  narration?: string | null;
  reason: HoldReason;
  sourceSheet?: string | null;
  sourceRow?: number | null;
}

export async function createHold(input: CreateHoldInput) {
  return prisma.dataSensePaymentHold.create({
    data: {
      tenantId: input.companyId,
      partyNameRaw: input.partyNameRaw,
      resolvedPartyId: input.resolvedPartyId ?? null,
      amount: round2(input.amount),
      valueDate: input.valueDate,
      narration: input.narration ?? null,
      reason: input.reason,
      sourceSheet: input.sourceSheet ?? null,
      sourceRow: input.sourceRow ?? null,
      status: 'OPEN',
      createdBy: input.userId,
    },
  });
}

function monthsOld(from: Date, now: Date): number {
  return (now.getTime() - from.getTime()) / (1000 * 60 * 60 * 24 * 30.4375);
}

function agingBucket(valueDate: Date, now: Date): '<1m' | '1-2m' | '2-3m' | '3-6m' | '>6m' {
  const m = monthsOld(valueDate, now);
  if (m < 1) return '<1m';
  if (m < 2) return '1-2m';
  if (m < 3) return '2-3m';
  if (m < 6) return '3-6m';
  return '>6m';
}

export async function listOpenHolds(companyId: string) {
  const now = new Date();
  const rows = await prisma.dataSensePaymentHold.findMany({
    where: { tenantId: companyId, status: 'OPEN' },
    orderBy: [{ valueDate: 'asc' }, { createdAt: 'asc' }],
  });
  const items = rows.map((r) => ({
    ...r,
    amount: Number(r.amount),
    ageBucket: agingBucket(r.valueDate, now),
  }));
  const byBucket: Record<string, { count: number; total: number }> = {};
  for (const it of items) {
    const b = (byBucket[it.ageBucket] ??= { count: 0, total: 0 });
    b.count += 1;
    b.total = round2(b.total + it.amount);
  }
  return {
    total: items.length,
    totalAmount: round2(items.reduce((s, it) => s + it.amount, 0)),
    byBucket,
    items,
  };
}

export interface ResolveHoldInput {
  action: 'apply-fifo' | 'discard';
  /** CUSTOMER_NOT_FOUND / AMBIGUOUS_PARTY के लिए owner जो customer चुने */
  customerId?: string;
  note?: string;
}

export async function resolveHold(
  companyId: string,
  userId: string,
  holdId: string,
  dto: ResolveHoldInput
) {
  const hold = await prisma.dataSensePaymentHold.findFirst({
    where: { id: holdId, tenantId: companyId },
  });
  if (!hold) throw new AppError('HOLD_NOT_FOUND', 'on-hold row नहीं मिली', 404);
  if (hold.status !== 'OPEN') {
    throw new AppError('HOLD_NOT_OPEN', `यह row पहले ही ${hold.status} है`, 409);
  }

  if (dto.action === 'discard') {
    return prisma.dataSensePaymentHold.update({
      where: { id: holdId },
      data: {
        status: 'DISCARDED',
        resolutionNote: dto.note ?? 'owner ने छोड़ी',
        resolvedBy: userId,
        resolvedAt: new Date(),
      },
    });
  }

  // apply-fifo — customer तय करो
  const customerId = hold.resolvedPartyId ?? dto.customerId;
  if (!customerId) {
    throw new AppError(
      'CUSTOMER_REQUIRED',
      'इस row पर customer तय नहीं — apply करने के लिए customerId भेजें',
      400
    );
  }
  const customer = await prisma.party_master.findFirst({
    where: {
      id: customerId,
      company_id: companyId,
      party_type: { in: ['customer', 'both'] },
    },
    select: { id: true, name: true },
  });
  if (!customer) throw new AppError('CUSTOMER_NOT_FOUND', 'customer नहीं मिला', 400);

  const result = await applyReceiptFifo({
    companyId,
    userId,
    customerId: customer.id,
    customerName: customer.name,
    amount: Number(hold.amount),
    valueDate: hold.valueDate,
    narration: hold.narration ?? `Data Sense on-hold ${hold.id}`,
    rowRef: `hold-${hold.id.slice(0, 8)}`,
  });

  if (result.status === 'no-open-invoice') {
    // OPEN ही रहे — owner discard करे या पहले बिल approve करे
    throw new AppError('NO_OPEN_INVOICE', `${customer.name} ${result.note} — row OPEN रखी`, 409);
  }

  return prisma.dataSensePaymentHold.update({
    where: { id: holdId },
    data: {
      status: 'RESOLVED',
      resolvedPartyId: customer.id,
      resolvedTxnId: result.txnId ?? null,
      resolutionNote: dto.note ? `${dto.note} — ${result.note}` : result.note,
      resolvedBy: userId,
      resolvedAt: new Date(),
    },
  });
}
