// GNT M20 — HSN Service (PUBLIC)
// Owner: D4-DELTA | Consumed by: M06, M07, M08, M09

import { PrismaClient, customs_tariff } from '@prisma/client';
import { HSNRepository } from '../repositories/hsn.repository';
import { EventBus } from '../../../shared/events/event-bus';
import { HSNItem, HSNValidationResponse } from '../types/trade.types';

export class HSNService {
  private repo: HSNRepository;

  constructor(private readonly prisma: PrismaClient, private readonly eventBus?: EventBus) {
    this.repo = new HSNRepository(prisma);
  }

  // ── PUBLIC: Search HSN ──
  async searchHSN(query: string, limit: number = 20): Promise<HSNItem[]> {
    const results = await this.repo.search(query, limit);
    return results.map(this.mapToHSNItem);
  }

  // ── PUBLIC: Get HSN Details ──
  async getHSNDetails(code: string): Promise<HSNItem | null> {
    const result = await this.repo.findByCode(code);
    return result ? this.mapToHSNItem(result) : null;
  }

  // ── PUBLIC: Validate HSN ──
  async validateHSN(code: string, productDescription?: string): Promise<HSNValidationResponse> {
    const hsn = await this.repo.findByCode(code);

    if (!hsn || !hsn.is_active) {
      const suggestions = await this.repo.search(code.substring(0, 4), 5);
      return {
        valid: false,
        code,
        message: `HSN code ${code} is invalid or inactive`,
        suggested_codes: suggestions.map(this.mapToHSNItem),
      };
    }

    // Publish classification event for M09 GST update
    if (this.eventBus) {
      await this.eventBus.publish('hsn.classified', {
        hsn_code: code,
        gst_rate: Number(hsn.gst_rate),
        igst_rate: Number(hsn.igst_rate),
        cess_rate: Number(hsn.cess_rate),
        product_description: productDescription,
        timestamp: new Date().toISOString(),
      });
    }

    return {
      valid: true,
      code,
      message: 'HSN code is valid and active',
      suggested_codes: [],
    };
  }

  // ── PUBLIC: Bulk Get HSN ──
  async getHSNCodes(codes: string[]): Promise<HSNItem[]> {
    const results = await this.repo.findByCodes(codes);
    return results.map(this.mapToHSNItem);
  }

  // ── PUBLIC: Get Chapters ──
  async getChapters(): Promise<string[]> {
    return this.repo.getChapters();
  }

  // ── PUBLIC: Get Headings ──
  async getHeadings(chapter: string): Promise<string[]> {
    return this.repo.getHeadingsByChapter(chapter);
  }

  private mapToHSNItem(hsn: customs_tariff): HSNItem {
    return {
      id: hsn.id,
      code: hsn.code,
      description: hsn.description,
      chapter: hsn.chapter,
      heading: hsn.heading,
      subheading: hsn.subheading,
      tariff_item: hsn.tariff_item,
      gst_rate: Number(hsn.gst_rate),
      igst_rate: Number(hsn.igst_rate),
      cess_rate: Number(hsn.cess_rate),
      is_active: hsn.is_active,
    };
  }
}
