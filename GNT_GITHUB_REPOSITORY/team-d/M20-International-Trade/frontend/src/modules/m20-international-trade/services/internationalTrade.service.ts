// GNT M20 — Trade API Service
// Owner: D4-DELTA

import {
  TradeJob,
  PaginatedTradeJobs,
  HSNItem,
  HSNValidationResult,
  FXRate,
  FXConvertResult,
  CustomsDutyBreakdown,
  TradeDocument,
  CreateShipmentRequest,
} from './internationalTrade.types';

const API_BASE = '/api/v1';

function getHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'x-company-id': localStorage.getItem('company_id') || '',
    Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Trade Shipments ──
export async function createExportShipment(data: CreateShipmentRequest): Promise<TradeJob> {
  const res = await fetch(`${API_BASE}/trade/exports`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<TradeJob>(res);
}

export async function createImportShipment(data: CreateShipmentRequest): Promise<TradeJob> {
  const res = await fetch(`${API_BASE}/trade/imports`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<TradeJob>(res);
}

export async function listTradeJobs(params?: {
  type?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedTradeJobs> {
  const query = new URLSearchParams(params as Record<string, string>);
  const res = await fetch(`${API_BASE}/trade/shipments?${query}`, {
    headers: getHeaders(),
  });
  return handleResponse<PaginatedTradeJobs>(res);
}

export async function getTradeJob(id: string): Promise<TradeJob> {
  const res = await fetch(`${API_BASE}/trade/shipments/${id}`, {
    headers: getHeaders(),
  });
  return handleResponse<TradeJob>(res);
}

// ── HSN ──
export async function searchHSN(query: string, limit: number = 20): Promise<HSNItem[]> {
  const res = await fetch(`${API_BASE}/hsn/search?q=${encodeURIComponent(query)}&limit=${limit}`, {
    headers: getHeaders(),
  });
  return handleResponse<HSNItem[]>(res);
}

export async function getHSNDetails(code: string): Promise<HSNItem> {
  const res = await fetch(`${API_BASE}/hsn/${code}`, {
    headers: getHeaders(),
  });
  return handleResponse<HSNItem>(res);
}

export async function validateHSN(code: string, productDescription?: string): Promise<HSNValidationResult> {
  const res = await fetch(`${API_BASE}/hsn/validate`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ code, product_description: productDescription }),
  });
  return handleResponse<HSNValidationResult>(res);
}

// ── FX ──
export async function getFXRates(base?: string, target?: string): Promise<FXRate[]> {
  const query = new URLSearchParams();
  if (base) query.set('base', base);
  if (target) query.set('target', target);
  const res = await fetch(`${API_BASE}/fx/rates?${query}`, {
    headers: getHeaders(),
  });
  return handleResponse<FXRate[]>(res);
}

export async function convertCurrency(
  amount: number,
  from: string,
  to: string
): Promise<FXConvertResult> {
  const res = await fetch(`${API_BASE}/fx/convert`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ amount, from_currency: from, to_currency: to }),
  });
  return handleResponse<FXConvertResult>(res);
}

// ── Customs ──
export async function calculateCustomsDuty(
  hsnCode: string,
  assessableValue: number,
  currency: string = 'USD',
  fxRate?: number
): Promise<CustomsDutyBreakdown> {
  const res = await fetch(`${API_BASE}/customs/calculate`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ hsn_code: hsnCode, assessable_value: assessableValue, currency, fx_rate: fxRate }),
  });
  return handleResponse<CustomsDutyBreakdown>(res);
}

export async function getCustomsRules(hsnCode: string): Promise<any[]> {
  const res = await fetch(`${API_BASE}/customs/rules?hsn_code=${hsnCode}`, {
    headers: getHeaders(),
  });
  return handleResponse<any[]>(res);
}

// ── Documents ──
export async function generateDocument(
  tradeJobId: string,
  documentType: string,
  metadata?: Record<string, unknown>
): Promise<TradeDocument> {
  const res = await fetch(`${API_BASE}/trade/documents/generate`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ trade_job_id: tradeJobId, document_type: documentType, metadata }),
  });
  return handleResponse<TradeDocument>(res);
}

export async function getDocument(id: string): Promise<TradeDocument> {
  const res = await fetch(`${API_BASE}/trade/documents/${id}`, {
    headers: getHeaders(),
  });
  return handleResponse<TradeDocument>(res);
}
