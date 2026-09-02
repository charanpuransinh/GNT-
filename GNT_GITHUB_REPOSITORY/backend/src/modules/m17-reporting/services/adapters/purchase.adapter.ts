import { IPurchaseService } from '../report.internal';
import { PurchaseReportData, PurchaseReportFilters } from '../../types/report.types';

/**
 * M17 → M07 adapter (टास्क #012)
 * m07 की reporting facade अभी बनी नहीं — खाली (झूठा डेटा नहीं)। TODO(#016)।
 */
export class PurchaseAdapter implements IPurchaseService {
  async getPurchaseRegister(_filters: PurchaseReportFilters): Promise<PurchaseReportData> {
    return {
      rows: [],
      summary: { totalPOs: 0, totalAmount: 0, totalReceived: 0, totalPending: 0 },
    };
  }
}
