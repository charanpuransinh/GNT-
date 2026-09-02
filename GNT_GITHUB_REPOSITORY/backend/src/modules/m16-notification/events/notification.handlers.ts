/**
 * GNT M16 — Notification Event Handlers
 * Event consumers for cross-module wiring
 * 
 * Subscriptions:
 *   sales.invoice.created     → M08 → M16
 *   purchase.invoice.approved → M07 → M16
 *   payment.received          → M11 → M16
 *   stock.low                 → M06 → M13 → M16
 *   gst.return.due            → M09 → M16
 *   employee.salary.processed → M12 → M16
 */

import { eventBus } from '../../../core/event-bus';
import { notificationService } from '../services/notification.service';
import { NotificationEvents } from './notification.events';

class NotificationEventHandlers {
  private static instance: NotificationEventHandlers;

  private constructor() {
    this.registerHandlers();
  }

  static getInstance(): NotificationEventHandlers {
    if (!NotificationEventHandlers.instance) {
      NotificationEventHandlers.instance = new NotificationEventHandlers();
    }
    return NotificationEventHandlers.instance;
  }

  private registerHandlers(): void {
    // M08 → M16: Sales Invoice Created
    eventBus.subscribe(NotificationEvents.SALES_INVOICE_CREATED, async (payload) => {
      console.log('[M16] Handling sales.invoice.created:', payload);
      await notificationService.handleEventNotification({
        eventName: NotificationEvents.SALES_INVOICE_CREATED,
        payload,
        targetUserIds: payload.customerUserIds ?? [],
        companyId: payload.companyId,
      });
    });

    // M07 → M16: Purchase Invoice Approved
    eventBus.subscribe(NotificationEvents.PURCHASE_INVOICE_APPROVED, async (payload) => {
      console.log('[M16] Handling purchase.invoice.approved:', payload);
      await notificationService.handleEventNotification({
        eventName: NotificationEvents.PURCHASE_INVOICE_APPROVED,
        payload,
        targetUserIds: payload.adminUserIds ?? [],
        companyId: payload.companyId,
      });
    });

    // M11 → M16: Payment Received
    eventBus.subscribe(NotificationEvents.PAYMENT_RECEIVED, async (payload) => {
      console.log('[M16] Handling payment.received:', payload);
      await notificationService.handleEventNotification({
        eventName: NotificationEvents.PAYMENT_RECEIVED,
        payload,
        targetUserIds: payload.partyUserIds ?? [],
        companyId: payload.companyId,
      });
    });

    // M06 → M13 → M16: Low Stock Alert
    eventBus.subscribe(NotificationEvents.STOCK_LOW, async (payload) => {
      console.log('[M16] Handling stock.low:', payload);
      await notificationService.handleEventNotification({
        eventName: NotificationEvents.STOCK_LOW,
        payload,
        targetUserIds: payload.managerUserIds ?? [],
        companyId: payload.companyId,
      });
    });

    // M09 → M16: GST Return Due
    eventBus.subscribe(NotificationEvents.GST_RETURN_DUE, async (payload) => {
      console.log('[M16] Handling gst.return.due:', payload);
      await notificationService.handleEventNotification({
        eventName: NotificationEvents.GST_RETURN_DUE,
        payload,
        targetUserIds: payload.accountantUserIds ?? [],
        companyId: payload.companyId,
      });
    });

    // M12 → M16: Employee Salary Processed
    eventBus.subscribe(NotificationEvents.EMPLOYEE_SALARY_PROCESSED, async (payload) => {
      console.log('[M16] Handling employee.salary.processed:', payload);
      await notificationService.handleEventNotification({
        eventName: NotificationEvents.EMPLOYEE_SALARY_PROCESSED,
        payload,
        targetUserIds: payload.employeeUserIds ?? [],
        companyId: payload.companyId,
      });
    });

    // Internal: Track delivery
    eventBus.subscribe(NotificationEvents.SENT, async (payload) => {
      console.log('[M16] Notification sent event:', payload);
      // M19 audit consumption hook
    });
  }

  /**
   * Initialize event handlers on module startup
   */
  initialize(): void {
    console.log('[M16] Notification event handlers initialized');
  }
}

export const notificationEventHandlers = NotificationEventHandlers.getInstance();
