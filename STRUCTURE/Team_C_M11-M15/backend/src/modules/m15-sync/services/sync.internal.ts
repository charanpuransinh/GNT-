// ============================================================
// M15 Sync Internal Service — Cross-Module Communication
// Lock Artifact: M15-L03
// Rule: ALL cross-module calls go through this service ONLY
// ============================================================

import axios from 'axios';

const INTERNAL_API_BASE = process.env.INTERNAL_API_BASE || 'http://localhost:3000';

/**
 * PUBLIC API: Fetch entities from other modules
 * Never call Prisma directly on another module's tables.
 */
export class SyncInternalService {
  private static async callModuleAPI(modulePath: string, endpoint: string, params?: Record<string, unknown>) {
    try {
      const res = await axios.get(`${INTERNAL_API_BASE}${modulePath}${endpoint}`, {
        params,
        timeout: 30000,
        headers: { 'x-internal-service': 'M15-SYNC' }
      });
      return res.data;
    } catch (error: any) {
      console.error(`[M15] Cross-module call failed: ${modulePath}${endpoint}`, error.message);
      throw new Error(`Module API unreachable: ${error.message}`);
    }
  }

  // ── M05 Inventory ─────────────────────────────────────────
  static async fetchItems(tenantId: string, filters?: any) {
    return this.callModuleAPI('/api/m05', '/items', { tenantId, ...filters });
  }

  static async fetchStock(tenantId: string, itemId?: string) {
    return this.callModuleAPI('/api/m05', '/stock', { tenantId, itemId });
  }

  // ── M06 Customer ──────────────────────────────────────────
  static async fetchCustomers(tenantId: string, filters?: any) {
    return this.callModuleAPI('/api/m06', '/customers', { tenantId, ...filters });
  }

  static async fetchCustomerById(tenantId: string, customerId: string) {
    return this.callModuleAPI('/api/m06', `/customers/${customerId}`, { tenantId });
  }

  // ── M07 Invoice ───────────────────────────────────────────
  static async fetchInvoices(tenantId: string, filters?: any) {
    return this.callModuleAPI('/api/m07', '/invoices', { tenantId, ...filters });
  }

  static async createInvoice(tenantId: string, data: any) {
    const res = await axios.post(`${INTERNAL_API_BASE}/api/m07/invoices`, data, {
      headers: { 'x-internal-service': 'M15-SYNC', 'x-tenant-id': tenantId }
    });
    return res.data;
  }

  static async updateInvoice(tenantId: string, invoiceId: string, data: any) {
    const res = await axios.patch(`${INTERNAL_API_BASE}/api/m07/invoices/${invoiceId}`, data, {
      headers: { 'x-internal-service': 'M15-SYNC', 'x-tenant-id': tenantId }
    });
    return res.data;
  }

  // ── M08 Ledger ────────────────────────────────────────────
  static async fetchLedgers(tenantId: string, filters?: any) {
    return this.callModuleAPI('/api/m08', '/ledgers', { tenantId, ...filters });
  }

  static async createLedgerEntry(tenantId: string, data: any) {
    const res = await axios.post(`${INTERNAL_API_BASE}/api/m08/ledgers`, data, {
      headers: { 'x-internal-service': 'M15-SYNC', 'x-tenant-id': tenantId }
    });
    return res.data;
  }

  // ── M11 Payment ───────────────────────────────────────────
  static async fetchPayments(tenantId: string, filters?: any) {
    return this.callModuleAPI('/api/m11', '/payments', { tenantId, ...filters });
  }

  static async createPayment(tenantId: string, data: any) {
    const res = await axios.post(`${INTERNAL_API_BASE}/api/m11/payments`, data, {
      headers: { 'x-internal-service': 'M15-SYNC', 'x-tenant-id': tenantId }
    });
    return res.data;
  }

  // ── M12 HR ──────────────────────────────────────────────
  static async fetchEmployees(tenantId: string, filters?: any) {
    return this.callModuleAPI('/api/m12', '/employees', { tenantId, ...filters });
  }

  static async fetchPayroll(tenantId: string, month?: string) {
    return this.callModuleAPI('/api/m12', '/payroll', { tenantId, month });
  }

  // ── M13 Automation ───────────────────────────────────────
  static async triggerAutomation(tenantId: string, ruleCode: string, payload: any) {
    const res = await axios.post(`${INTERNAL_API_BASE}/api/m13/rules/${ruleCode}/trigger`, payload, {
      headers: { 'x-internal-service': 'M15-SYNC', 'x-tenant-id': tenantId }
    });
    return res.data;
  }

  // ── M14 Import/Export ────────────────────────────────────
  static async exportData(tenantId: string, entityType: string, format: string) {
    return this.callModuleAPI('/api/m14', '/exports', { tenantId, entityType, format });
  }

  // ── Generic Entity Resolver ──────────────────────────────
  static async resolveEntity(entityType: string, tenantId: string, action: 'FETCH' | 'CREATE' | 'UPDATE' | 'DELETE', data?: any) {
    const entityMap: Record<string, { module: string; endpoint: string }> = {
      'ITEM': { module: '/api/m05', endpoint: '/items' },
      'CUSTOMER': { module: '/api/m06', endpoint: '/customers' },
      'INVOICE': { module: '/api/m07', endpoint: '/invoices' },
      'PAYMENT': { module: '/api/m11', endpoint: '/payments' },
      'RECEIPT': { module: '/api/m11', endpoint: '/receipts' },
      'LEDGER': { module: '/api/m08', endpoint: '/ledgers' },
      'EMPLOYEE': { module: '/api/m12', endpoint: '/employees' },
      'PAYROLL': { module: '/api/m12', endpoint: '/payroll' }
    };

    const mapping = entityMap[entityType];
    if (!mapping) throw new Error(`Unknown entity type: ${entityType}`);

    const url = `${INTERNAL_API_BASE}${mapping.module}${mapping.endpoint}`;

    switch (action) {
      case 'FETCH':
        return axios.get(url, { params: { tenantId }, timeout: 30000 }).then(r => r.data);
      case 'CREATE':
        return axios.post(url, data, { headers: { 'x-tenant-id': tenantId }, timeout: 30000 }).then(r => r.data);
      case 'UPDATE':
        return axios.patch(`${url}/${data.id}`, data, { headers: { 'x-tenant-id': tenantId }, timeout: 30000 }).then(r => r.data);
      case 'DELETE':
        return axios.delete(`${url}/${data.id}`, { headers: { 'x-tenant-id': tenantId }, timeout: 30000 }).then(r => r.data);
    }
  }
}
