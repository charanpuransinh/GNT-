/**
 * M08 SALES & BILLING — Frontend API Service
 * Module: m08-sales | Team: B4-BRAVO
 * ALL API calls for quotation, order, invoice, return, receipt, challan
 */

import axios from 'axios';
import {
  SalesInvoice,
  SalesInvoiceItem,
  Quotation,
  QuotationItem,
  SalesOrder,
  SalesOrderItem,
  SalesReturn,
  SalesReturnItem,
  DeliveryChallan,
  DeliveryChallanItem,
  InvoicePayment,
  PrintRequest,
  ShareRequest,
  InvoiceQuery,
  QuotationQuery,
  OrderQuery,
  ReturnQuery,
  ApiResponse,
  Customer,
} from './sales.types';
import { API_ENDPOINTS } from './sales.constants';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: { 'Content-Type': 'application/json' },
});

// Add auth headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  const companyId = localStorage.getItem('company_id');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (companyId) config.headers['x-company-id'] = companyId;
  return config;
});

// ─── SALES INVOICE ───
export const invoiceApi = {
  create: (data: Omit<SalesInvoice, 'id' | 'invoiceNumber' | 'status' | 'paymentStatus' | 'amountPaid' | 'createdAt' | 'updatedAt'>) =>
    api.post<ApiResponse<SalesInvoice>>(API_ENDPOINTS.INVOICES, data),

  getAll: (params?: InvoiceQuery) =>
    api.get<ApiResponse<SalesInvoice[]>>(API_ENDPOINTS.INVOICES, { params }),

  getById: (id: string) =>
    api.get<ApiResponse<SalesInvoice>>(`${API_ENDPOINTS.INVOICES}/${id}`),

  update: (id: string, data: Partial<SalesInvoice>) =>
    api.put<ApiResponse<SalesInvoice>>(`${API_ENDPOINTS.INVOICES}/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse<void>>(`${API_ENDPOINTS.INVOICES}/${id}`),

  approve: (id: string) =>
    api.post<ApiResponse<SalesInvoice>>(`${API_ENDPOINTS.INVOICES}/${id}/approve`),

  post: (id: string) =>
    api.post<ApiResponse<SalesInvoice>>(`${API_ENDPOINTS.INVOICES}/${id}/post`),

  recordPayment: (id: string, payment: InvoicePayment) =>
    api.post<ApiResponse<SalesInvoice>>(`${API_ENDPOINTS.INVOICES}/${id}/payment`, payment),

  generatePrint: (id: string, template: PrintRequest['template']) =>
    api.post<string>(`${API_ENDPOINTS.INVOICES}/${id}/print`, { template }, { responseType: 'text' }),

  share: (id: string, data: Omit<ShareRequest, 'invoiceId'>) =>
    api.post<ApiResponse<{ success: boolean; message: string }>>(`${API_ENDPOINTS.INVOICES}/${id}/share`, data),

  convertOrder: (orderId: string, data?: Partial<SalesInvoice>) =>
    api.post<ApiResponse<SalesInvoice>>(`${API_ENDPOINTS.ORDERS}/${orderId}/convert`, data),
};

// ─── QUOTATION ───
export const quotationApi = {
  create: (data: Omit<Quotation, 'id' | 'quotationNumber' | 'status' | 'createdAt' | 'updatedAt'>) =>
    api.post<ApiResponse<Quotation>>(API_ENDPOINTS.QUOTATIONS, data),

  getAll: (params?: QuotationQuery) =>
    api.get<ApiResponse<Quotation[]>>(API_ENDPOINTS.QUOTATIONS, { params }),

  getById: (id: string) =>
    api.get<ApiResponse<Quotation>>(`${API_ENDPOINTS.QUOTATIONS}/${id}`),

  update: (id: string, data: Partial<Quotation>) =>
    api.put<ApiResponse<Quotation>>(`${API_ENDPOINTS.QUOTATIONS}/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse<void>>(`${API_ENDPOINTS.QUOTATIONS}/${id}`),

  send: (id: string) =>
    api.post<ApiResponse<Quotation>>(`${API_ENDPOINTS.QUOTATIONS}/${id}/send`),

  convertToOrder: (id: string, data?: Partial<SalesOrder>) =>
    api.post<ApiResponse<SalesOrder>>(`${API_ENDPOINTS.QUOTATIONS}/${id}/convert`, data),
};

// ─── SALES ORDER ───
export const orderApi = {
  getAll: (params?: OrderQuery) =>
    api.get<ApiResponse<SalesOrder[]>>(API_ENDPOINTS.ORDERS, { params }),

  getById: (id: string) =>
    api.get<ApiResponse<SalesOrder>>(`${API_ENDPOINTS.ORDERS}/${id}`),

  confirm: (id: string) =>
    api.post<ApiResponse<SalesOrder>>(`${API_ENDPOINTS.ORDERS}/${id}/confirm`),

  deliver: (id: string) =>
    api.post<ApiResponse<SalesOrder>>(`${API_ENDPOINTS.ORDERS}/${id}/deliver`),
};

// ─── SALES RETURN ───
export const returnApi = {
  create: (data: Omit<SalesReturn, 'id' | 'returnNumber' | 'status' | 'createdAt' | 'updatedAt'>) =>
    api.post<ApiResponse<SalesReturn>>(API_ENDPOINTS.RETURNS, data),

  getAll: (params?: ReturnQuery) =>
    api.get<ApiResponse<SalesReturn[]>>(API_ENDPOINTS.RETURNS, { params }),

  getById: (id: string) =>
    api.get<ApiResponse<SalesReturn>>(`${API_ENDPOINTS.RETURNS}/${id}`),

  approve: (id: string) =>
    api.post<ApiResponse<SalesReturn>>(`${API_ENDPOINTS.RETURNS}/${id}/approve`),

  post: (id: string) =>
    api.post<ApiResponse<SalesReturn>>(`${API_ENDPOINTS.RETURNS}/${id}/post`),
};

// ─── DELIVERY CHALLAN ───
export const challanApi = {
  create: (data: Omit<DeliveryChallan, 'id' | 'challanNumber' | 'status' | 'createdAt'>) =>
    api.post<ApiResponse<DeliveryChallan>>(API_ENDPOINTS.CHALLANS, data),

  getAll: (params?: { salesOrderId?: string; status?: string; page?: number; limit?: number }) =>
    api.get<ApiResponse<DeliveryChallan[]>>(API_ENDPOINTS.CHALLANS, { params }),

  getById: (id: string) =>
    api.get<ApiResponse<DeliveryChallan>>(`${API_ENDPOINTS.CHALLANS}/${id}`),
};

// ─── CUSTOMER (M05 integration) ───
export const customerApi = {
  search: (query: string) =>
    api.get<ApiResponse<Customer[]>>(`/api/v1/parties/customers/search`, { params: { q: query } }),

  getById: (id: string) =>
    api.get<ApiResponse<Customer>>(`/api/v1/parties/customers/${id}`),

  checkCreditLimit: (id: string, amount: number) =>
    api.get<ApiResponse<{ allowed: boolean; limit: number; used: number }>>(`/api/v1/parties/customers/${id}/credit-check`, { params: { amount } }),
};

// ─── PRODUCT (M06 integration) ───
export const productApi = {
  search: (query: string) =>
    api.get<ApiResponse<Array<{ id: string; name: string; rate: number; hsnCode: string; taxRate: number }>>>(`/api/v1/inventory/products/search`, { params: { q: query } }),

  getStock: (productId: string, branchId: string) =>
    api.get<ApiResponse<{ available: boolean; stock: number }>>(`/api/v1/inventory/stock/check`, { params: { productId, branchId } }),
};
