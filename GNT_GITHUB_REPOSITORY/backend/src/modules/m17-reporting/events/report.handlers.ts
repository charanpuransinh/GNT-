/**
 * M17 Reporting — Event Consumers
 * Owner: D4-DELTA
 */
import { EventBus } from '../../../shared/event-bus';
import { REPORT_EVENTS, ReportSubscriptionEvent } from './report.events';
import { ReportService } from '../services/report.service';
import { reportCache } from '../services/report.cache';

export class ReportEventHandlers {
  constructor(private readonly reportService: ReportService) {}

  register(): void {
    // Subscribe to cross-module events to update report caches
    EventBus.on(
      REPORT_EVENTS.SUBSCRIPTIONS.SALES_INVOICE_CREATED,
      this.handleSalesInvoiceCreated.bind(this)
    );
    EventBus.on(
      REPORT_EVENTS.SUBSCRIPTIONS.PURCHASE_INVOICE_APPROVED,
      this.handlePurchaseInvoiceApproved.bind(this)
    );
    EventBus.on(
      REPORT_EVENTS.SUBSCRIPTIONS.STOCK_UPDATED,
      this.handleStockUpdated.bind(this)
    );
    EventBus.on(
      REPORT_EVENTS.SUBSCRIPTIONS.PAYMENT_RECEIVED,
      this.handlePaymentReceived.bind(this)
    );
    EventBus.on(
      REPORT_EVENTS.SUBSCRIPTIONS.EMPLOYEE_SALARY_PROCESSED,
      this.handleSalaryProcessed.bind(this)
    );
  }

  /**
   * Handle sales.invoice.created
   * → Update sales report cache
   */
  private async handleSalesInvoiceCreated(payload: {
    invoiceId: string;
    companyId: string;
    customerId: string;
    totalAmount: number;
    timestamp: string;
  }): Promise<void> {
    console.log(`[M17] Sales invoice created: ${payload.invoiceId}`);
    // Invalidate sales report cache for the company
    await this.invalidateReportCache(payload.companyId, 'sales');
    // Publish report updated event
    EventBus.emit(REPORT_EVENTS.PUBLICATIONS.REPORT_GENERATED, {
      reportType: 'sales',
      companyId: payload.companyId,
      triggeredBy: 'sales.invoice.created',
    });
  }

  /**
   * Handle purchase.invoice.approved
   * → Update purchase report cache
   */
  private async handlePurchaseInvoiceApproved(payload: {
    poId: string;
    companyId: string;
    supplierId: string;
    amount: number;
    timestamp: string;
  }): Promise<void> {
    console.log(`[M17] Purchase invoice approved: ${payload.poId}`);
    await this.invalidateReportCache(payload.companyId, 'purchase');
    EventBus.emit(REPORT_EVENTS.PUBLICATIONS.REPORT_GENERATED, {
      reportType: 'purchase',
      companyId: payload.companyId,
      triggeredBy: 'purchase.invoice.approved',
    });
  }

  /**
   * Handle stock.updated
   * → Update inventory report cache
   */
  private async handleStockUpdated(payload: {
    productId: string;
    companyId: string;
    warehouseId: string;
    quantity: number;
    timestamp: string;
  }): Promise<void> {
    console.log(`[M17] Stock updated: ${payload.productId}`);
    await this.invalidateReportCache(payload.companyId, 'inventory');
    EventBus.emit(REPORT_EVENTS.PUBLICATIONS.REPORT_GENERATED, {
      reportType: 'inventory',
      companyId: payload.companyId,
      triggeredBy: 'stock.updated',
    });
  }

  /**
   * Handle payment.received
   * → Update outstanding report
   */
  private async handlePaymentReceived(payload: {
    paymentId: string;
    companyId: string;
    customerId: string;
    amount: number;
    timestamp: string;
  }): Promise<void> {
    console.log(`[M17] Payment received: ${payload.paymentId}`);
    await this.invalidateReportCache(payload.companyId, 'accounting');
    EventBus.emit(REPORT_EVENTS.PUBLICATIONS.REPORT_GENERATED, {
      reportType: 'accounting',
      companyId: payload.companyId,
      triggeredBy: 'payment.received',
    });
  }

  /**
   * Handle employee.salary.processed
   * → Update HR report cache
   */
  private async handleSalaryProcessed(payload: {
    salaryId: string;
    companyId: string;
    employeeId: string;
    month: string;
    netSalary: number;
    timestamp: string;
  }): Promise<void> {
    console.log(`[M17] Salary processed: ${payload.salaryId}`);
    await this.invalidateReportCache(payload.companyId, 'hr');
    EventBus.emit(REPORT_EVENTS.PUBLICATIONS.REPORT_GENERATED, {
      reportType: 'hr',
      companyId: payload.companyId,
      triggeredBy: 'employee.salary.processed',
    });
  }

  /**
   * Invalidate report cache for a company and report type.
   * Uses report.cache.ts (in-process Map today; swap for Redis in
   * production by editing report.cache.ts only — this call site
   * doesn't need to change).
   */
  private async invalidateReportCache(companyId: string, reportType: string): Promise<void> {
    const removed = reportCache.invalidate(companyId, reportType);
    console.log(`[M17] Cache invalidated: ${companyId}/${reportType} (${removed} entries removed)`);
  }
}
