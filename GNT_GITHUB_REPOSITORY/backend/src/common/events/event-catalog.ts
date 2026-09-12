// ============================================================================
// GNT — Canonical cross-module event catalog (in-process bus)
//
// FAISLA (owner, 2026-09-06): cross-module transport = in-process `eventBus`
// (common/events/event-bus.ts). Redis / BullMQ abhi NAHI (single-server scale).
//
// Ye file cross-module events ka SINGLE SOURCE OF TRUTH hai:
//   - naam: `GNT_EVENTS.*` — wahi jo publisher SACH ME emit karta hai
//     (grep se verify: sales.invoice.created, payment.completed, stock.low,
//      import.completed, gst.einvoice.generated…). event-registry.json ke
//      purane naam (`invoice.created`, `po.approved`) galat hain — koi publish
//      nahi karta; unko yahan use MAT karo.
//   - payload: har event me company id hoga, par publishers alag key bhejte
//     hain — `tenantId` (M11/M12/M14), `companyId` (M08/M16/M17), `company_id`
//     (M06/M07/M09 snake_case). Subscriber `eventCompanyId(payload)` use kare.
//
// Poora contract table: tips/owner-puran-singh/log.md (2026-09-06 wiring pass).
// ============================================================================

export const GNT_EVENTS = {
  // ── M08 Sales ──
  SALES_INVOICE_CREATED: 'sales.invoice.created',
  SALES_RETURN_CREATED: 'sales.return.created',
  SALES_QUOTATION_CONVERTED: 'sales.quotation.converted',

  // ── M07 Purchase (jab wire ho — abhi M07 event publish nahi karta) ──
  PURCHASE_INVOICE_APPROVED: 'purchase.invoice.approved',

  // ── M06 Inventory ──
  STOCK_UPDATED: 'stock.updated',
  STOCK_LOW: 'stock.low',

  // ── M09 GST ──
  GST_EINVOICE_GENERATED: 'gst.einvoice.generated',

  // ── M11 Payment ──
  PAYMENT_CREATED: 'payment.created',
  PAYMENT_COMPLETED: 'payment.completed',
  PAYMENT_FAILED: 'payment.failed',
  INVOICE_PAYMENT_RECEIVED: 'invoice.payment_received',

  // ── M12 HR (HrEventPublisher relay — PAYROLL_PAID -> payroll.paid) ──
  PAYROLL_GENERATED: 'payroll.generated',
  PAYROLL_PAID: 'payroll.paid',
  LEAVE_APPLIED: 'leave.applied',
  LEAVE_APPROVED: 'leave.approved',
  LEAVE_REJECTED: 'leave.rejected',
  EMPLOYEE_CREATED: 'employee.created',
  EMPLOYEE_UPDATED: 'employee.updated',
  EMPLOYEE_DELETED: 'employee.deleted',

  // ── M14 Import/Export ──
  IMPORT_COMPLETED: 'import.completed',
  EXPORT_COMPLETED: 'export.completed',

  // ── M02 Auth / M04 Permissions (audit-relevant) ──
  USER_LOGIN_SUCCESS: 'user.login.success',
  USER_LOGIN_FAILED: 'user.login.failed',
  PERMISSION_CHANGED: 'permission.changed',

  // ── M18 External ──
  INTEGRATION_WEBHOOK_FAILED: 'integration.webhook.failed',

  // ── M23 Security & Governance (added 2026-09-12) ──
  SECURITY_ACCESS_DENIED: 'security.access_denied',
  SECURITY_CROSS_TENANT_ATTEMPT: 'security.cross_tenant_attempt',
  SECURITY_POLICY_CHANGED: 'security.policy_changed',
  SECURITY_SENSITIVE_DATA_ACCESSED: 'security.sensitive_data_accessed',
  SECURITY_RETENTION_EXECUTED: 'security.retention_executed',
} as const;

export type GntEventName = (typeof GNT_EVENTS)[keyof typeof GNT_EVENTS];

/**
 * Har cross-module event payload me company id hoga — teeno shapes
 * (tenantId | companyId | company_id) me se jo mile. Naya code isse use kare
 * (M16/M17/M19 me inline `?? ?? ??` ki jagah).
 */
export function eventCompanyId(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const p = payload as Record<string, unknown>;
  if (typeof p.tenantId === 'string') return p.tenantId;
  if (typeof p.companyId === 'string') return p.companyId;
  if (typeof p.company_id === 'string') return p.company_id;
  return undefined;
}
