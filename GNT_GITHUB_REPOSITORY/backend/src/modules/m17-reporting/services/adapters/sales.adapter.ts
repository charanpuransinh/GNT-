import { ISalesService } from '../report.internal';
import { SalesReportData, SalesReportFilters } from '../../types/report.types';

/**
 * M17 → M08 adapter (टास्क #012)
 * m08 की reporting facade अभी बनी नहीं — इसलिए खाली (झूठा डेटा नहीं)। TODO(#016)।
 */
export class SalesAdapter implements ISalesService {
  async getSalesRegister(_filters: SalesReportFilters): Promise<SalesReportData> {
    return {
      rows: [],
      summary: {
        totalInvoices: 0,
        totalQuantity: 0,
        totalGross: 0,
        totalDiscount: 0,
        totalTax: 0,
        totalRevenue: 0,
        avgMargin: 0,
      },
    };
  }
}
