import { inventoryService } from '@/modules/m06-inventory';
import { IInventoryService } from '../report.internal';
import { InventoryReportData, InventoryReportFilters, InventoryReportRow } from '../../types/report.types';

/**
 * M17 → M06 adapter (टास्क #012, समीक्षक AI का फैसला)
 * IInventoryService को implement करता है और M06 की facade (सिर्फ़-पढ़ने वाला दरवाज़ा)
 * का जवाब M17 के InventoryReportData आकार में ढालता है।
 */
export class InventoryAdapter implements IInventoryService {
  async getStockSummary(filters: InventoryReportFilters): Promise<InventoryReportData> {
    if (!filters.companyId) {
      return { rows: [], valuation: { totalItems: 0, totalStockValue: 0, lowStockCount: 0, overStockCount: 0 } };
    }
    const summary = await inventoryService.getStockSummary(
      filters.companyId,
      filters.asOfDate ? new Date(filters.asOfDate) : new Date()
    );

    const rows: InventoryReportRow[] = summary.rows.map((r) => ({
      productId: r.product_id,
      productName: r.product_name,
      sku: '',
      warehouse: '',
      openingStock: 0,
      inwardQty: 0,
      outwardQty: 0,
      closingStock: r.quantity,
      unitCost: r.quantity > 0 ? r.value / r.quantity : 0,
      stockValue: r.value,
      reorderLevel: 0,
      stockStatus: r.quantity === 0 ? 'zero' : 'ok',
    }));

    return {
      rows,
      valuation: {
        totalItems: summary.total_items,
        totalStockValue: summary.total_value,
        lowStockCount: rows.filter((r) => r.stockStatus === 'low').length,
        overStockCount: rows.filter((r) => r.stockStatus === 'over').length,
      },
    };
  }

  async getProductList(): Promise<{ id: string; name: string; sku: string }[]> {
    // TODO(#016): M06 की facade में product list आने पर असली डेटा
    return [];
  }
}
