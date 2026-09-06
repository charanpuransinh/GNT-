/**
 * M17 Reporting — Event Consumers
 * Owner: D4-DELTA
 *
 * 2026-09-06 (Claude): companyId ab `eventCompanyId(payload)` se — M11/M12/M14
 * `tenantId` bhejte hain, `payload.companyId` undefined jata tha aur cache
 * kabhi invalidate hi nahi hota tha. Event naam report.events.ts me canonical
 * (common/events/event-catalog.ts GNT_EVENTS ke saath align).
 */
import { eventBus } from '../../../shared/events/event-bus';
import { eventCompanyId } from '../../../common/events/event-catalog';
import { REPORT_EVENTS } from './report.events';
import { ReportService } from '../services/report.service';
import { reportCache } from '../services/report.cache';

export class ReportEventHandlers {
  private registered = false;

  constructor(private readonly reportService: ReportService) {}

  register(): void {
    if (this.registered) return; // दोबारा mount पर दोहरा subscribe नहीं
    this.registered = true;
    const S = REPORT_EVENTS.SUBSCRIPTIONS;
    eventBus.subscribe(S.SALES_INVOICE_CREATED, (p) => this.onSource(p, 'sales', S.SALES_INVOICE_CREATED));
    eventBus.subscribe(S.PURCHASE_INVOICE_APPROVED, (p) => this.onSource(p, 'purchase', S.PURCHASE_INVOICE_APPROVED));
    eventBus.subscribe(S.STOCK_UPDATED, (p) => this.onSource(p, 'inventory', S.STOCK_UPDATED));
    eventBus.subscribe(S.PAYMENT_RECEIVED, (p) => this.onSource(p, 'accounting', S.PAYMENT_RECEIVED));
    eventBus.subscribe(S.EMPLOYEE_SALARY_PROCESSED, (p) => this.onSource(p, 'hr', S.EMPLOYEE_SALARY_PROCESSED));
  }

  /** source data badla → us company ke us report-type ka cache invalidate + report.generated */
  private onSource(payload: unknown, reportType: string, triggeredBy: string): void {
    const companyId = eventCompanyId(payload);
    if (!companyId) {
      console.warn(`[M17] "${triggeredBy}" event me company id nahi mila — cache invalidate skip`);
      return;
    }
    const removed = reportCache.invalidate(companyId, reportType);
    console.log(`[M17] cache invalidated: ${companyId}/${reportType} (${removed}) — trigger: ${triggeredBy}`);
    void eventBus
      .publish(REPORT_EVENTS.PUBLICATIONS.REPORT_GENERATED, { reportType, companyId, triggeredBy })
      .catch(() => {});
  }
}
