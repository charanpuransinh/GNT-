import { IGSTService } from '../report.internal';
import { GSTReportData, GSTReportFilters } from '../../types/report.types';

/**
 * M17 → M09 adapter (टास्क #012)
 * m09 की reporting facade अभी बनी नहीं — खाली (झूठा डेटा नहीं)। TODO(#016)।
 */
export class GSTAdapter implements IGSTService {
  async getGSTTransactions(_filters: GSTReportFilters): Promise<GSTReportData> {
    return {
      rows: [],
      hsnSummary: [],
      summary: { totalTaxable: 0, totalCGST: 0, totalSGST: 0, totalIGST: 0, grandTotalTax: 0 },
    };
  }

  async getHSNSummary(): Promise<Array<{ hsnCode: string; description: string; totalQuantity: number; taxableValue: number; cgstRate: number; sgstRate: number; igstRate: number; totalTax: number }>> {
    return [];
  }
}
