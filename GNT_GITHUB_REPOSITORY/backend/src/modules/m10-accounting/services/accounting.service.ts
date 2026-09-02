/**
 * M10 — Reporting Facade (ROUGH SCAFFOLDING — समीक्षक AI, 2026-09-02)
 * सिर्फ़-पढ़ने वाला दरवाज़ा, ताकि M17 को ledger/repository तक न जाना पड़े।
 * मालिक M10 ही है; यहाँ से कोई entry नहीं बनेगी।
 */
import { prisma } from '@/common/config/prisma';

export interface LedgerEntryRow {
  id: string;
  date: Date;
  account_id: string;
  narration: string;
  debit: number;
  credit: number;
}

export interface AgingBucketRow {
  party_id: string;
  party_name: string;
  current: number;
  days_0_30: number;
  days_31_60: number;
  days_61_90: number;
  days_90_plus: number;
  total: number;
}

export interface CashflowPoint {
  period: string;
  inflow: number;
  outflow: number;
  net: number;
}

export class AccountingService {
  async getLedgerEntries(company_id: string, from: Date, to: Date): Promise<LedgerEntryRow[]> {
    const rows = await prisma.ledger.findMany({
      where: { company_id, transaction_date: { gte: from, lte: to } },
      orderBy: { transaction_date: 'asc' },
    });
    return rows.map((r) => ({
      id: r.id,
      date: r.transaction_date,
      account_id: r.account_id,
      narration: r.narration ?? '',
      debit: Number(r.debit_amount ?? 0),
      credit: Number(r.credit_amount ?? 0),
    }));
  }

  /** TODO(#016): असली aging — party-wise बकाया की उम्र। अभी खाली सूची लौटाता है (झूठा डेटा नहीं गढ़ता)। */
  async getAgingReport(_company_id: string, _as_on: Date = new Date()): Promise<AgingBucketRow[]> {
    return [];
  }

  /** TODO(#016): असली cashflow — M11 के receipts/payments से। अभी खाली सूची। */
  async getCashflow(_company_id: string, _from: Date, _to: Date): Promise<CashflowPoint[]> {
    return [];
  }
}

export const accountingService = new AccountingService();
