// M12 — Income Tax / TDS Slab Service (effective-dated, admin-editable)
// Rule: tax slabs कभी hardcode नहीं — DB table से read, owner admin screen se add/edit।
import { prisma } from '@/common/config/prisma';

export type TaxRegime = 'OLD' | 'NEW';

export interface TaxSlabInput {
  financialYear: string; // "2026-27"
  regime: TaxRegime;
  incomeFrom: number;
  incomeTo?: number | null; // null = no upper limit
  taxRatePercent: number;
  cessPercent?: number;
  effectiveFrom?: Date;
  effectiveTo?: Date | null;
  isActive?: boolean;
}

export class TaxSlabService {
  async listSlabs(financialYear: string, regime: TaxRegime) {
    return prisma.taxSlabMaster.findMany({
      where: { financialYear, regime },
      orderBy: { incomeFrom: 'asc' },
    });
  }

  /** batch add (ek financial year ka pura slab set) — overlap validation ke saath */
  async createSlabs(slabs: TaxSlabInput[], userId?: string) {
    if (slabs.length === 0) return { count: 0 };
    for (const s of slabs) await this.assertNoOverlap(s);
    return prisma.taxSlabMaster.createMany({
      data: slabs.map((s) => ({
        financialYear: s.financialYear,
        regime: s.regime,
        incomeFrom: s.incomeFrom,
        incomeTo: s.incomeTo ?? null,
        taxRatePercent: s.taxRatePercent,
        cessPercent: s.cessPercent ?? 0,
        effectiveFrom: s.effectiveFrom ?? new Date(),
        effectiveTo: s.effectiveTo ?? null,
        isActive: s.isActive ?? true,
        createdBy: userId ?? null,
      })),
    });
  }

  /** overlap: same financialYear+regime me income-range overlap na ho */
  private async assertNoOverlap(input: TaxSlabInput) {
    const existing = await prisma.taxSlabMaster.findMany({
      where: { financialYear: input.financialYear, regime: input.regime, isActive: true },
    });
    for (const e of existing) {
      const eTo = e.incomeTo ? Number(e.incomeTo) : Infinity;
      const newTo = input.incomeTo ?? Infinity;
      const overlaps = Number(input.incomeFrom) < eTo && newTo > Number(e.incomeFrom);
      if (overlaps) {
        throw new Error(
          `Overlap: incomeFrom ${input.incomeFrom} existing slab (${e.incomeFrom} - ${e.incomeTo ?? '∞'}) se takrata hai`
        );
      }
    }
  }

  /** progressive annual tax (empty slabs → 0, कोई dummy numbers नहीं) */
  async calculateAnnualTax(annualIncome: number, financialYear: string, regime: TaxRegime): Promise<number> {
    const slabs = await prisma.taxSlabMaster.findMany({
      where: { financialYear, regime, isActive: true },
      orderBy: { incomeFrom: 'asc' },
    });
    if (slabs.length === 0) return 0;

    let tax = 0;
    for (const slab of slabs) {
      const lower = Number(slab.incomeFrom);
      const upper = slab.incomeTo ? Number(slab.incomeTo) : Infinity;
      if (annualIncome >= lower) {
        // incomeFrom = slab ki pehli rupee (e.g. 400001) — taxable = min(annual, upper) - lower + 1
        const taxable = Math.min(annualIncome, upper) - lower + 1;
        tax += taxable * Number(slab.taxRatePercent) / 100;
      }
    }
    // 4% health & education cess (standard)
    tax *= 1.04;
    return Math.round(tax * 100) / 100;
  }

  async calculateMonthlyTDS(monthlySalary: number, financialYear: string, regime: TaxRegime = 'NEW'): Promise<number> {
    const annual = monthlySalary * 12;
    const annualTax = await this.calculateAnnualTax(annual, financialYear, regime);
    return Math.round((annualTax / 12) * 100) / 100;
  }
}

export const taxSlabService = new TaxSlabService();
