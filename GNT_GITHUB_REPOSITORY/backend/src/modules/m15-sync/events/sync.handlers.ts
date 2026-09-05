// ============================================================
// M15 Sync Module — Event Subscribers / Handlers
// Lock Artifact: M15-L05
// ============================================================

import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { SyncEventPublisher } from './sync.events';
import { SyncService } from '../services/sync.service';

const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null
});

/**
 * Subscribe to cross-module events that M15 cares about.
 */
export class SyncEventSubscriber {
  static initialize(): void {
    // Listen for events from other modules
    const worker = new Worker('gnt-events', async (job) => {
      const event = job.data;

      switch (event.eventType) {
        // ── M11 Payment Events ──────────────────────────────
        case 'PAYMENT_CREATED':
        case 'PAYMENT_UPDATED':
          await this.handlePaymentChange(event);
          break;

        // ── M07 Invoice Events ──────────────────────────────
        case 'INVOICE_CREATED':
        case 'INVOICE_UPDATED':
          await this.handleInvoiceChange(event);
          break;

        // ── M05 Inventory Events ────────────────────────────
        case 'STOCK_UPDATED':
          await this.handleStockChange(event);
          break;

        // ── M06 Customer Events ─────────────────────────────
        case 'CUSTOMER_CREATED':
        case 'CUSTOMER_UPDATED':
          await this.handleCustomerChange(event);
          break;

        // ── M12 HR Events ───────────────────────────────────
        case 'PAYROLL_PROCESSED':
          await this.handlePayrollProcessed(event);
          break;

        // ── M13 Automation Events ───────────────────────────
        case 'AUTOMATION_TRIGGERED':
          await this.handleAutomationTriggered(event);
          break;

        // ── M14 Import/Export Events ──────────────────────────
        case 'IMPORT_COMPLETED':
          await this.handleImportCompleted(event);
          break;

        default:
          // Unknown event — log and ignore
          console.log(`[M15] Unhandled event type: ${event.eventType}`);
      }
    }, { connection: redis });

    worker.on('failed', (job, err) => {
      console.error(`[M15] Event handler failed for ${job?.name}:`, err.message);
    });

    console.log('[M15] Event subscriber initialized');
  }

  private static async handlePaymentChange(event: any): Promise<void> {
    // If there's a real-time sync config for payments, trigger it
    console.log(`[M15] Payment change detected: ${event.payload?.paymentId}`);
    const tenantId = event.tenantId;
    if (!tenantId) return;

    const configs = await SyncService.listConfigs(tenantId, { status: 'ACTIVE' });
    const paymentConfigs = configs.filter(c =>
      (c.entityConfigs ?? []).some(ec => ec.isActive && ec.internalEntity === 'PAYMENT')
    );

    for (const config of paymentConfigs) {
      try {
        await SyncService.triggerSync(
          { syncConfigId: config.id, triggeredBy: 'EVENT', entityType: 'PAYMENT' },
          tenantId
        );
      } catch (err: any) {
        console.error(
          `[M15] Failed to queue PAYMENT sync for config ${config.configCode}:`,
          err.message
        );
      }
    }
  }

  private static async handleInvoiceChange(event: any): Promise<void> {
    console.log(`[M15] Invoice change detected: ${event.payload.invoiceId}`);
  }

  private static async handleStockChange(event: any): Promise<void> {
    console.log(`[M15] Stock change detected: ${event.payload.itemId}`);
  }

  private static async handleCustomerChange(event: any): Promise<void> {
    console.log(`[M15] Customer change detected: ${event.payload.customerId}`);
  }

  private static async handlePayrollProcessed(event: any): Promise<void> {
    console.log(`[M15] Payroll processed: ${event.payload.month}`);
    // Could trigger sync to external accounting system
  }

  private static async handleAutomationTriggered(event: any): Promise<void> {
    console.log(`[M15] Automation triggered: ${event.payload.ruleCode}`);
  }

  private static async handleImportCompleted(event: any): Promise<void> {
    console.log(`[M15] Import completed: ${event.payload.jobId}`);
    // Could trigger post-import sync to external systems
  }
}
