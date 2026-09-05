// ============================================================================
// M05 PARTY MANAGEMENT — Repository (module-निजी — public export नहीं)
// ⚠️ tenant-सुरक्षा नियम (टास्क #009/#007): हर query में company_id अनिवार्य
// ============================================================================

import { PrismaClient } from '@prisma/client';
import { CreatePartyDTO, UpdatePartyDTO, PartyQuery } from '../types/party.types';

export class PartyRepository {
  constructor(private prisma: PrismaClient) {}

  async create(company_id: string, dto: CreatePartyDTO, userId?: string) {
    return this.prisma.party_master.create({
      data: {
        company_id,
        branch_id: dto.branch_id ?? null,
        party_type: dto.party_type,
        name: dto.name,
        display_name: dto.display_name ?? null,
        gstin: dto.gstin ?? null,
        pan: dto.pan ?? null,
        gst_type: dto.gst_type ?? null,
        contact_person: dto.contact_person ?? null,
        phone: dto.phone ?? null,
        alt_phone: dto.alt_phone ?? null,
        email: dto.email || null,
        billing_address: dto.billing_address ?? null,
        shipping_address: dto.shipping_address ?? null,
        city: dto.city ?? null,
        state_code: dto.state_code ?? null,
        pincode: dto.pincode ?? null,
        country: dto.country ?? 'IN',
        credit_limit: dto.credit_limit ?? 0,
        credit_days: dto.credit_days ?? 0,
        opening_balance: dto.opening_balance ?? 0,
        opening_type: dto.opening_type ?? 'dr',
        notes: dto.notes ?? null,
        created_by: userId ?? null,
        updated_by: userId ?? null,
      },
    });
  }

  async findById(id: string, company_id: string) {
    return this.prisma.party_master.findFirst({
      where: { id, company_id },
    });
  }

  async findMany(company_id: string, query: PartyQuery) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = {
      company_id,
      ...(query.party_type ? { party_type: query.party_type } : {}),
      ...(query.is_active !== undefined ? { is_active: query.is_active } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' as const } },
              { display_name: { contains: query.search, mode: 'insensitive' as const } },
              { gstin: { contains: query.search, mode: 'insensitive' as const } },
              { phone: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.party_master.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.party_master.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async update(id: string, company_id: string, dto: UpdatePartyDTO, userId?: string) {
    return this.prisma.party_master.updateMany({
      where: { id, company_id },
      data: {
        ...(dto.party_type !== undefined ? { party_type: dto.party_type } : {}),
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.display_name !== undefined ? { display_name: dto.display_name } : {}),
        ...(dto.gstin !== undefined ? { gstin: dto.gstin } : {}),
        ...(dto.pan !== undefined ? { pan: dto.pan } : {}),
        ...(dto.gst_type !== undefined ? { gst_type: dto.gst_type } : {}),
        ...(dto.contact_person !== undefined ? { contact_person: dto.contact_person } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.alt_phone !== undefined ? { alt_phone: dto.alt_phone } : {}),
        ...(dto.email !== undefined ? { email: dto.email || null } : {}),
        ...(dto.billing_address !== undefined ? { billing_address: dto.billing_address } : {}),
        ...(dto.shipping_address !== undefined ? { shipping_address: dto.shipping_address } : {}),
        ...(dto.city !== undefined ? { city: dto.city } : {}),
        ...(dto.state_code !== undefined ? { state_code: dto.state_code } : {}),
        ...(dto.pincode !== undefined ? { pincode: dto.pincode } : {}),
        ...(dto.country !== undefined ? { country: dto.country } : {}),
        ...(dto.credit_limit !== undefined ? { credit_limit: dto.credit_limit } : {}),
        ...(dto.credit_days !== undefined ? { credit_days: dto.credit_days } : {}),
        ...(dto.opening_balance !== undefined ? { opening_balance: dto.opening_balance } : {}),
        ...(dto.opening_type !== undefined ? { opening_type: dto.opening_type } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        ...(dto.is_active !== undefined ? { is_active: dto.is_active } : {}),
        updated_by: userId ?? null,
      },
    });
  }

  async softDelete(id: string, company_id: string) {
    return this.prisma.party_master.updateMany({
      where: { id, company_id },
      data: { is_active: false },
    });
  }

  // database/migrations/010_M05_party_ledger_view.sql — blueprint §8.1 का
  // party_ledger_view, हर party का running balance (M10 के ledger से)
  async getLedgerBalance(id: string, company_id: string): Promise<number | null> {
    const rows = await this.prisma.$queryRaw<Array<{ balance: string }>>`
      SELECT balance FROM party_ledger_view WHERE party_id = ${id}::uuid AND company_id = ${company_id}::uuid
    `;
    return rows.length > 0 ? Number(rows[0].balance) : null;
  }
}
