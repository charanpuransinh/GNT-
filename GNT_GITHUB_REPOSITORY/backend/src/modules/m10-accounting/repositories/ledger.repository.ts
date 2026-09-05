import { PrismaClient } from '@prisma/client';

/**
 * 2026-09-05 — दो बड़े बदलाव:
 *
 * 1) **कंपनी की सीमा**: पहले यहाँ की कोई भी method `company_id` नहीं देखती थी। सिर्फ़
 *    `account_id` जानकर कोई भी दूसरी कंपनी की खाता-बही और बैलेंस पढ़ सकता था।
 *    (M10 की बाक़ी तीन रिपोर्टें 2026-09-04 को ठीक हुई थीं; ये दो छूट गई थीं।)
 *
 * 2) **मालिक का हार्ड रूल (party isolation)**: "हर party का ledger, बैलेंस, transaction
 *    history पूरी तरह अपने आप में self-contained रहेगा।" पहले `getLedgerEntries` में
 *    `partyId` **वैकल्पिक** था — यानी खाते से पढ़ने पर उस खाते की *सारी* parties की
 *    पंक्तियाँ एक साथ लौटतीं, और `getBalanceAsOfDate` में party की छन्नी थी ही नहीं।
 *    इसलिए party-वार पढ़ने के लिए अलग methods हैं जिनमें party हमेशा अनिवार्य है।
 */
export class LedgerRepository {
  constructor(private prisma: PrismaClient) {}

  async getLedgerEntries(
    companyId: string,
    accountId: string,
    fromDate?: Date,
    toDate?: Date,
    partyId?: string,
  ): Promise<any[]> {
    return this.prisma.ledger.findMany({
      where: {
        company_id: companyId,
        account_id: accountId,
        ...(fromDate && toDate ? { transaction_date: { gte: fromDate, lte: toDate } } : {}),
        ...(partyId ? { party_id: partyId } : {}),
      },
      orderBy: { transaction_date: 'asc' },
    });
  }

  async getBalanceAsOfDate(companyId: string, accountId: string, asOfDate?: Date): Promise<number> {
    const account = await this.prisma.account_master.findFirst({
      where: { id: accountId, company_id: companyId },
    });
    const opening = Number(account?.opening_balance || 0);
    const agg = await this.prisma.ledger.aggregate({
      where: {
        company_id: companyId,
        account_id: accountId,
        ...(asOfDate ? { transaction_date: { lte: asOfDate } } : {}),
      },
      _sum: { debit_amount: true, credit_amount: true },
    });
    return Number((opening + Number(agg._sum.debit_amount || 0) - Number(agg._sum.credit_amount || 0)).toFixed(4));
  }

  // ── मालिक का हार्ड रूल: party-वार, पूरी तरह अपने में बंद ────────────────
  //
  // इनमें `partyId` **कभी वैकल्पिक नहीं**। इसलिए एक party का ledger/बैलेंस माँगने पर
  // दूसरी party की एक भी पंक्ति लौट ही नहीं सकती — चाहे दोनों एक ही खाते पर हों,
  // और चाहे party active हो या inactive।

  async getPartyLedger(companyId: string, partyId: string, fromDate?: Date, toDate?: Date): Promise<any[]> {
    return this.prisma.ledger.findMany({
      where: {
        company_id: companyId,
        party_id: partyId,
        ...(fromDate && toDate ? { transaction_date: { gte: fromDate, lte: toDate } } : {}),
      },
      orderBy: { transaction_date: 'asc' },
    });
  }

  /**
   * party का अपना बैलेंस — शुरुआती बकाया उसी party के `party_master` से आता है,
   * किसी साझा खाते से नहीं। इसलिए यह आँकड़ा किसी दूसरी party पर निर्भर नहीं है।
   */
  async getPartyBalance(companyId: string, partyId: string, asOfDate?: Date): Promise<number> {
    const party = await this.prisma.party_master.findFirst({
      where: { id: partyId, company_id: companyId },
      select: { opening_balance: true, opening_type: true },
    });
    // dr = हमें लेना है (+), cr = हमें देना है (−)
    const opening = party
      ? Number(party.opening_balance || 0) * (party.opening_type === 'cr' ? -1 : 1)
      : 0;

    const agg = await this.prisma.ledger.aggregate({
      where: {
        company_id: companyId,
        party_id: partyId,
        ...(asOfDate ? { transaction_date: { lte: asOfDate } } : {}),
      },
      _sum: { debit_amount: true, credit_amount: true },
    });
    return Number((opening + Number(agg._sum.debit_amount || 0) - Number(agg._sum.credit_amount || 0)).toFixed(4));
  }

  async getLedgerSumsByAccount(companyId: string, asOfDate?: Date): Promise<Record<string, { debit: number; credit: number }>> {
    const rows = await this.prisma.ledger.groupBy({
      by: ['account_id'],
      where: {
        company_id: companyId,
        ...(asOfDate ? { transaction_date: { lte: asOfDate } } : {}),
      },
      _sum: { debit_amount: true, credit_amount: true },
    });
    const map: Record<string, { debit: number; credit: number }> = {};
    for (const r of rows) {
      map[r.account_id] = {
        debit: Number(r._sum.debit_amount || 0),
        credit: Number(r._sum.credit_amount || 0),
      };
    }
    return map;
  }
}
