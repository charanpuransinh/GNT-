// ============================================================================
// M05 PARTY MANAGEMENT — PartyService (PUBLIC — दूसरे modules इसी को बुलाएँगे)
// टास्क #007 का public contract:
//   getCustomerById / getSupplierById / checkCreditLimit / getOutstanding / getAging
// ============================================================================

import { prisma } from '@/common/config/prisma';
import type { Prisma } from '@prisma/client';
import { PartyRepository } from '../repositories/party.repository';
import { checkCreditLimitInternal, emptyAging } from './party.internal';
import {
  Party,
  PartyQuery,
  CreatePartyDTO,
  UpdatePartyDTO,
  PartyOutstanding,
  PartyAging,
  CreditCheckResult,
} from '../types/party.types';

// Prisma row → Party DTO: Decimal → Number (रुपये, 2 दशमलव — DTO number माँगता है)
type PartyRow = Prisma.party_masterGetPayload<Record<string, never>>;

function toParty(row: PartyRow): Party {
  return {
    ...row,
    // DB column free-text String है — बनाते/बदलते वक़्त Zod इन्हीं enum मानों तक सीमित रखता है
    party_type: row.party_type as Party['party_type'],
    opening_type: row.opening_type as Party['opening_type'],
    credit_limit: Number(row.credit_limit),
    opening_balance: Number(row.opening_balance),
  };
}

export class PartyService {
  private repository: PartyRepository;

  constructor() {
    this.repository = new PartyRepository(prisma);
  }

  // ─── CRUD (public) ───
  async createParty(company_id: string, dto: CreatePartyDTO, userId?: string): Promise<Party> {
    return toParty(await this.repository.create(company_id, dto, userId));
  }

  async getPartyById(id: string, company_id: string): Promise<Party | null> {
    const row = await this.repository.findById(id, company_id);
    return row ? toParty(row) : null;
  }

  async listParties(company_id: string, query: PartyQuery) {
    const result = await this.repository.findMany(company_id, query);
    return { ...result, data: result.data.map(toParty) };
  }

  async updateParty(id: string, company_id: string, dto: UpdatePartyDTO, userId?: string): Promise<Party | null> {
    await this.repository.update(id, company_id, dto, userId);
    return this.getPartyById(id, company_id);
  }

  async deactivateParty(id: string, company_id: string): Promise<void> {
    await this.repository.softDelete(id, company_id);
  }

  // ─── M08 आज भी ये तीन बुला रहा है — इनके बिना M05 अधूरा ───
  async getCustomerById(id: string, company_id: string): Promise<Party | null> {
    const party = await this.getPartyById(id, company_id);
    if (!party) return null;
    if (party.party_type === 'supplier') return null; // ग्राहक नहीं है
    return party;
  }

  async getSupplierById(id: string, company_id: string): Promise<Party | null> {
    const party = await this.getPartyById(id, company_id);
    if (!party) return null;
    if (party.party_type === 'customer') return null; // सप्लायर नहीं है
    return party;
  }

  async checkCreditLimit(party_id: string, company_id: string, new_amount: number): Promise<CreditCheckResult> {
    const party = await this.getPartyById(party_id, company_id);
    if (!party) return { allowed: false, limit: 0, used: 0, available: 0, reason: 'Party not found' };
    // TODO(#016): असली चल बकाया M10 के ledger से गिनना है — अभी 0 (नक़ली आँकड़े मना)
    return checkCreditLimitInternal(party, 0, new_amount);
  }

  /** TODO(#016): असली बकाया M10 के ledger से गिनकर आएगा — अभी ख़ाली (झूठा डेटा मना) */
  async getOutstanding(_party_id: string, _company_id: string): Promise<PartyOutstanding> {
    return {
      party_id: _party_id,
      outstanding: 0,
      currency: 'INR',
      as_on: new Date(),
    };
  }

  /** TODO(#016): असली aging M10 से — अभी शून्य (झूठे आँकड़े नहीं) */
  async getAging(party_id: string, _company_id: string): Promise<PartyAging> {
    return emptyAging(party_id);
  }
}

// public contract के हिसाब से तैयार singleton
export const partyService = new PartyService();
