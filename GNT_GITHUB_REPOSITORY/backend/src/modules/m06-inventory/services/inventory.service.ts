/**
 * M06 — Reporting Facade (ROUGH SCAFFOLDING — समीक्षक AI, 2026-09-02)
 *
 * क्यों बनी: M17 (Reporting) को stock का जोड़ चाहिए, पर उसे M06 की repository तक
 * पहुँचने की अनुमति नहीं है (master wiring map: HARD BOUNDARY)। इसलिए M06 अपनी तरफ़ से
 * यह **सिर्फ़-पढ़ने वाला** दरवाज़ा देता है — मालिक M06 ही रहता है।
 *
 * नियम: यहाँ से कुछ भी लिखा/बदला नहीं जाएगा, सिर्फ़ पढ़ा जाएगा।
 */
import { prisma } from '@/common/config/prisma';

export interface StockSummaryRow {
  product_id: string;
  product_name: string;
  quantity: number;
  value: number;
}

export interface StockSummary {
  company_id: string;
  as_on: Date;
  total_items: number;
  total_value: number;
  rows: StockSummaryRow[];
}

export class InventoryService {
  async getStockSummary(company_id: string, as_on: Date = new Date()): Promise<StockSummary> {
    const stock = await prisma.stock_master.findMany({
      where: { company_id },
      include: { product: true },
    });

    const rows: StockSummaryRow[] = stock.map((s) => ({
      product_id: s.product_id,
      product_name: s.product?.name ?? '',
      quantity: Number(s.quantity ?? 0),
      value: Number(s.quantity ?? 0) * Number(s.avg_purchase_price ?? 0),
    }));

    return {
      company_id,
      as_on,
      total_items: rows.length,
      total_value: rows.reduce((sum, r) => sum + r.value, 0),
      rows,
    };
  }
}

export const inventoryService = new InventoryService();
