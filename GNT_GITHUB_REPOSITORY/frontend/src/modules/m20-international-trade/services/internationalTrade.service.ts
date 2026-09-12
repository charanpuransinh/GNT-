// GNT M20 — Trade API Service
// Owner: D4-DELTA
//
// पहले raw fetch() था — localStorage से 'token'/'company_id' पढ़ता था (कभी सेट
// नहीं होते, असली token 'gnt-auth-store' में है — apiClient सही जगह पढ़ता है)।
// साथ ही hsn/fx/customs — तीनों backend पर M20 के अपने router में हैं, जो
// `/api/v1/trade` पर mounted है — यानी असली रास्ता `/trade/hsn/...` है, यहाँ
// `/hsn/...` (बिना "trade") भेजा जा रहा था, हमेशा 404।
import { apiClient } from '@/core/api-client';
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

const API_BASE = '/api/v1/trade';

// ── Trade Shipments ──
export async function createExportShipment(data: CreateShipmentRequest): Promise<TradeJob> {
  return (await apiClient.post<TradeJob>(`${API_BASE}/exports`, data)).data;
}

export async function createImportShipment(data: CreateShipmentRequest): Promise<TradeJob> {
  return (await apiClient.post<TradeJob>(`${API_BASE}/imports`, data)).data;
}

export async function listTradeJobs(params?: {
  type?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedTradeJobs> {
  return (await apiClient.get<PaginatedTradeJobs>(`${API_BASE}/shipments`, { params })).data;
}

export async function getTradeJob(id: string): Promise<TradeJob> {
  return (await apiClient.get<TradeJob>(`${API_BASE}/shipments/${id}`)).data;
}

// ── HSN ──
export async function searchHSN(query: string, limit: number = 20): Promise<HSNItem[]> {
  return (await apiClient.get<HSNItem[]>(`${API_BASE}/hsn/search`, { params: { q: query, limit } })).data;
}

export async function getHSNDetails(code: string): Promise<HSNItem> {
  return (await apiClient.get<HSNItem>(`${API_BASE}/hsn/${code}`)).data;
}

export async function validateHSN(code: string, productDescription?: string): Promise<HSNValidationResult> {
  return (await apiClient.post<HSNValidationResult>(`${API_BASE}/hsn/validate`, { code, product_description: productDescription })).data;
}

// ── FX ──
export async function getFXRates(base?: string, target?: string): Promise<FXRate[]> {
  return (await apiClient.get<FXRate[]>(`${API_BASE}/fx/rates`, { params: { base, target } })).data;
}

export async function convertCurrency(
  amount: number,
  from: string,
  to: string
): Promise<FXConvertResult> {
  return (await apiClient.post<FXConvertResult>(`${API_BASE}/fx/convert`, { amount, from_currency: from, to_currency: to })).data;
}

// ── Customs ──
export async function calculateCustomsDuty(
  hsnCode: string,
  assessableValue: number,
  currency: string = 'USD',
  fxRate?: number
): Promise<CustomsDutyBreakdown> {
  return (await apiClient.post<CustomsDutyBreakdown>(`${API_BASE}/customs/calculate`, {
    hsn_code: hsnCode, assessable_value: assessableValue, currency, fx_rate: fxRate,
  })).data;
}

export async function getCustomsRules(hsnCode: string): Promise<any[]> {
  return (await apiClient.get<any[]>(`${API_BASE}/customs/rules`, { params: { hsn_code: hsnCode } })).data;
}

// ── Documents ──
export async function generateDocument(
  tradeJobId: string,
  documentType: string,
  metadata?: Record<string, unknown>
): Promise<TradeDocument> {
  return (await apiClient.post<TradeDocument>(`${API_BASE}/documents/generate`, {
    trade_job_id: tradeJobId, document_type: documentType, metadata,
  })).data;
}

export async function getDocument(id: string): Promise<TradeDocument> {
  return (await apiClient.get<TradeDocument>(`${API_BASE}/documents/${id}`)).data;
}
