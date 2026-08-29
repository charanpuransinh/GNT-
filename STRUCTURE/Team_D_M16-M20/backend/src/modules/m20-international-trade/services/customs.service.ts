// GNT M20 — Customs Service (PUBLIC)
// Owner: D4-DELTA | Consumed by: M11 (Payment trigger)

import { PrismaClient } from '@prisma/client';
import { CustomsRepository } from '../repositories/customs.repository';
import { FXService } from './fx.service';
import { EventBus } from '../../../shared/events/event-bus';
import { CustomsDutyBreakdown, CustomsRule } from '../types/trade.types';
import { AppError } from '../../../shared/errors/app-error';

export class CustomsService {
  private repo: CustomsRepository;
  private fxService: FXService;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly eventBus?: EventBus,
    fxService?: FXService
  ) {
    this.repo = new CustomsRepository(prisma);
    this.fxService = fxService || new FXService(prisma);
  }

  // ── PUBLIC: Calculate Customs Duty ──
  async calculateCustomsDuty(
    companyId: string,
    hsnCode: string,
    assessableValue: number,
    currency: string = 'USD',
    fxRate?: number
  ): Promise<CustomsDutyBreakdown> {
    const rule = await this.repo.findLatestRule(companyId, hsnCode);
    if (!rule) {
      throw new AppError('CUSTOMS_RULE_MISSING', `No customs rule found for HSN ${hsnCode}`, 400);
    }

    // Convert to INR if needed
    let valueInr = assessableValue;
    if (currency !== 'INR') {
      if (fxRate) {
        valueInr = assessableValue * fxRate;
      } else {
        const conversion = await this.fxService.convertAmount(
          companyId,
          assessableValue,
          currency,
          'INR'
        );
        valueInr = conversion.converted_amount;
      }
    }

    const bcdRate = Number(rule.bcd_rate);
    const acdRate = Number(rule.acd_rate);
    const sadRate = Number(rule.sad_rate);
    const cvdRate = Number(rule.cvd_rate);
    const antiDumpingRate = Number(rule.anti_dumping_rate);
    const safeguardRate = Number(rule.safeguard_duty);

    const bcd = this.round(valueInr * (bcdRate / 100));
    const acd = this.round(valueInr * (acdRate / 100));
    const sad = this.round(valueInr * (sadRate / 100));
    const cvd = this.round(valueInr * (cvdRate / 100));
    const antiDumping = this.round(valueInr * (antiDumpingRate / 100));
    const safeguard = this.round(valueInr * (safeguardRate / 100));

    // IGST on (CIF + BCD + SAD + CVD + AntiDumping + Safeguard)
    const igstBase = valueInr + bcd + sad + cvd + antiDumping + safeguard;
    const igstRate = 0.18; // default IGST; ideally fetched from HSN
    const igst = this.round(igstBase * igstRate);

    // Cess (default 0 unless specified)
    const cess = 0;

    const totalDuty = this.round(bcd + acd + sad + cvd + antiDumping + safeguard + igst + cess);

    const breakdown: CustomsDutyBreakdown = {
      hsn_code: hsnCode,
      assessable_value_inr: this.round(valueInr),
      bcd,
      acd,
      sad,
      cvd,
      anti_dumping: antiDumping,
      safeguard,
      igst,
      cess,
      total_duty: totalDuty,
      breakup: [
        { label: 'Basic Customs Duty (BCD)', rate: bcdRate, amount: bcd },
        { label: 'Additional Customs Duty (ACD)', rate: acdRate, amount: acd },
        { label: 'Special Additional Duty (SAD)', rate: sadRate, amount: sad },
        { label: 'Countervailing Duty (CVD)', rate: cvdRate, amount: cvd },
        { label: 'Anti-Dumping Duty', rate: antiDumpingRate, amount: antiDumping },
        { label: 'Safeguard Duty', rate: safeguardRate, amount: safeguard },
        { label: 'IGST', rate: igstRate * 100, amount: igst },
        { label: 'Cess', rate: 0, amount: cess },
      ],
    };

    if (this.eventBus) {
      await this.eventBus.publish('customs.duty.calculated', {
        trade_job_id: '', // caller should fill
        hsn_code: hsnCode,
        total_duty: totalDuty,
        timestamp: new Date().toISOString(),
      });
    }

    return breakdown;
  }

  // ── PUBLIC: Get Customs Rules ──
  async getCustomsRules(companyId: string, hsnCode: string): Promise<CustomsRule[]> {
    const rules = await this.repo.findActiveRules(companyId, hsnCode);
    return rules.map((r) => ({
      id: r.id,
      company_id: r.company_id,
      hsn_code: r.hsn_code,
      bcd_rate: Number(r.bcd_rate),
      acd_rate: Number(r.acd_rate),
      sad_rate: Number(r.sad_rate),
      cvd_rate: Number(r.cvd_rate),
      anti_dumping_rate: Number(r.anti_dumping_rate),
      safeguard_duty: Number(r.safeguard_duty),
      effective_from: r.effective_from.toISOString(),
      effective_to: r.effective_to?.toISOString() || null,
    }));
  }

  private round(n: number): number {
    return Math.round(n * 100) / 100;
  }
}
