import { Payment, Invoice, Refund, BankAccount, PaymentMethod, ApiResponse } from '../types';

const API_BASE = '/api/v1/payments';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'x-tenant-id': localStorage.getItem('tenantId') || '',
  'x-user-id': localStorage.getItem('userId') || '',
});

const handleResponse = async <T>(res: Response): Promise<ApiResponse<T>> => {
  if (!res.ok) throw new Error((await res.json()).error?.message || 'Request failed');
  return res.json();
};

export const paymentApi = {
  getPayments: (params?: URLSearchParams) => 
    fetch(`${API_BASE}/transactions?${params || ''}`, { headers: getHeaders() }).then(r => handleResponse<Payment[]>(r)),
  getPayment: (id: string) => 
    fetch(`${API_BASE}/transactions/${id}`, { headers: getHeaders() }).then(r => handleResponse<Payment>(r)),
  createPayment: (data: Partial<Payment>) => 
    fetch(`${API_BASE}/transactions`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(r => handleResponse<Payment>(r)),
  processPayment: (id: string) => 
    fetch(`${API_BASE}/transactions/${id}/process`, { method: 'POST', headers: getHeaders() }).then(r => handleResponse<Payment>(r)),
};

export const invoiceApi = {
  getInvoices: (params?: URLSearchParams) => 
    fetch(`${API_BASE}/invoices?${params || ''}`, { headers: getHeaders() }).then(r => handleResponse<Invoice[]>(r)),
  getInvoice: (id: string) => 
    fetch(`${API_BASE}/invoices/${id}`, { headers: getHeaders() }).then(r => handleResponse<Invoice>(r)),
  createInvoice: (data: Partial<Invoice>) => 
    fetch(`${API_BASE}/invoices`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(r => handleResponse<Invoice>(r)),
  sendInvoice: (id: string) => 
    fetch(`${API_BASE}/invoices/${id}/send`, { method: 'POST', headers: getHeaders() }).then(r => handleResponse<Invoice>(r)),
};

export const refundApi = {
  getRefunds: () => 
    fetch(`${API_BASE}/refunds`, { headers: getHeaders() }).then(r => handleResponse<Refund[]>(r)),
  createRefund: (data: Partial<Refund>) => 
    fetch(`${API_BASE}/refunds`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(r => handleResponse<Refund>(r)),
  approveRefund: (id: string) => 
    fetch(`${API_BASE}/refunds/${id}/approve`, { method: 'POST', headers: getHeaders() }).then(r => handleResponse<Refund>(r)),
};

export const bankApi = {
  getAccounts: () => 
    fetch(`${API_BASE}/bank-accounts`, { headers: getHeaders() }).then(r => handleResponse<BankAccount[]>(r)),
};

export const methodApi = {
  getMethods: () => 
    fetch(`${API_BASE}/methods`, { headers: getHeaders() }).then(r => handleResponse<PaymentMethod[]>(r)),
};
