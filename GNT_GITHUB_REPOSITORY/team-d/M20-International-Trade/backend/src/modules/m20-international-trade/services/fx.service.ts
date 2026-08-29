// GNT M20 — FX Service (PUBLIC)
// Owner: D4-DELTA | Consumed by: M06, M08, M09, M10, M11

import { PrismaClient, fx_rate } from '@prisma/client';
import { FXRepository } from '../repositories/fx.repository';
import { EventBus } from '../../../shared/events/event-bus';
import { FXConvertResponse } from '../types/trade.types';
import { AppError } from '../../../shared/errors/app-error';

export class FXService {
  private repo: FXRepository;

  constructor(private readonly prisma: PrismaClient, private readonly eventBus?: EventBus) {
    this.repo = new FXRepository(prisma);
  }

  // ── PUBLIC: Get FX Rate ──
  async getFXRate(companyId: string, base: string, target: string): Promise<fx_rate | null> {
    if (base === target) {
      return {
        id: 'self',
        company_id: companyId,
        base_currency: base,
        target_currency: target,
        rate: 1,
        source: 'system',
        effective_date: new Date(),
        created_at: new Date(),
      } as fx_rate;
    }
    return this.repo.findLatest(companyId, base, target);
  }

  // ── PUBLIC: Get All Rates ──
  async getFXRates(companyId: string, baseCurrency?: string): Promise<fx_rate[]> {
    return this.repo.findAllByCompany(companyId, baseCurrency);
  }

  // ── PUBLIC: Convert Amount ──
  async convertAmount(
    companyId: string,
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<FXConvertResponse> {
    if (fromCurrency === toCurrency) {
      return {
        original_amount: amount,
        converted_amount: amount,
        rate: 1,
        from_currency: fromCurrency,
        to_currency: toCurrency,
      };
    }

    const rateRecord = await this.getFXRate(companyId, fromCurrency, toCurrency);
    if (!rateRecord) {
      throw new AppError(
        'FX_RATE_MISSING',
        `FX rate not found for ${fromCurrency}/${toCurrency}`,
        400
      );
    }

    const rate = Number(rateRecord.rate);
    const converted = amount * rate;

    return {
      original_amount: amount,
      converted_amount: Number(converted.toFixed(4)),
      rate,
      from_currency: fromCurrency,
      to_currency: toCurrency,
    };
  }

  // ── PUBLIC: Upsert Rate ──
  async upsertRate(
    companyId: string,
    baseCurrency: string,
    targetCurrency: string,
    rate: number,
    source: string = 'manual'
  ): Promise<fx_rate> {
    const result = await this.repo.upsertRate(
      companyId,
      baseCurrency,
      targetCurrency,
      rate,
      source,
      new Date()
    );

    if (this.eventBus) {
      await this.eventBus.publish('fx.rate.updated', {
        company_id: companyId,
        base_currency: baseCurrency,
        target_currency: targetCurrency,
        rate,
        effective_date: new Date().toISOString(),
      });
    }

    return result;
  }
}
