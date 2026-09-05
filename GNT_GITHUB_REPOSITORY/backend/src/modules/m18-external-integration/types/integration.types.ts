/**
 * M18 — External Integration Types
 * Owner: D4-DELTA
 */

export enum GatewayType {
  SMS = 'sms',
  WHATSAPP = 'whatsapp',
  PAYMENT = 'payment',
  GSTN = 'gstn',
  E_INVOICE = 'e_invoice',
  E_WAY_BILL = 'e_way_bill',
}

export enum GatewayStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  PENDING = 'pending',
  DEGRADED = 'degraded',
}

export enum WebhookStatus {
  RECEIVED = 'received',
  VALIDATED = 'validated',
  PROCESSED = 'processed',
  FAILED = 'failed',
  RETRYING = 'retrying',
}

// ─── Integration Config ───
export interface IntegrationConfig {
  id: string;
  company_id: string;
  provider: string;
  type: GatewayType;
  config_json: Record<string, unknown>;
  status: GatewayStatus;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateIntegrationConfigDto {
  company_id: string;
  provider: string;
  type: GatewayType;
  config_json: Record<string, unknown>;
  status?: GatewayStatus;
  is_active?: boolean;
}

export interface UpdateIntegrationConfigDto {
  provider?: string;
  config_json?: Record<string, unknown>;
  status?: GatewayStatus;
  is_active?: boolean;
}

// ─── API Key Registry ───
export interface ApiKeyRegistry {
  id: string;
  company_id: string;
  name: string;
  key_hash: string;
  permissions: string[];
  expires_at: Date | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateApiKeyDto {
  company_id: string;
  name: string;
  permissions: string[];
  expires_at?: Date | null;
  created_by: string;
}

export interface ApiKeyResponse {
  id: string;
  name: string;
  permissions: string[];
  expires_at: Date | null;
  created_at: Date;
  /** Plain key shown ONLY once at creation */
  plain_key?: string;
}

// ─── Webhook Log ───
export interface WebhookLog {
  id: string;
  provider: string;
  event_id: string | null;
  payload: Record<string, unknown>;
  headers: Record<string, string>;
  status: WebhookStatus;
  processed_at: Date | null;
  error_message: string | null;
  created_at: Date;
}

export interface CreateWebhookLogDto {
  provider: string;
  event_id?: string | null;
  payload: Record<string, unknown>;
  headers: Record<string, string>;
  status?: WebhookStatus;
  error_message?: string | null;
}

// ─── Gateway Service DTOs ───
export interface SendWhatsAppDto {
  phone: string;
  message: string;
  template_name?: string;
  template_data?: Record<string, string>;
}

export interface SendSmsDto {
  phone: string;
  message: string;
  sender_id?: string;
}
export interface SendEmailDto {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface ProcessPaymentDto {
  gateway: string;
  amount: number;
  currency: string;
  order_id: string;
  metadata?: Record<string, unknown>;
}

export interface VerifyGstnDto {
  gstin: string;
}

export interface GatewayTestResult {
  success: boolean;
  latency_ms: number;
  message: string;
  timestamp: Date;
}

// ─── Webhook Service DTOs ───
export interface ReceiveWebhookDto {
  headers: Record<string, string>;
  raw_body: string;
}

// ─── Status DTOs ───
export interface GatewayStatusDto {
  type: GatewayType;
  provider: string;
  status: GatewayStatus;
  last_checked: Date;
  latency_ms: number;
  message?: string;
}

// ─── Event Payloads ───
export interface WebhookReceivedEvent {
  provider: string;
  payload: Record<string, unknown>;
  webhook_log_id: string;
}

export interface GatewayStatusChangedEvent {
  integration_id: string;
  previous_status: GatewayStatus;
  current_status: GatewayStatus;
  provider: string;
  type: GatewayType;
}

export interface PaymentWebhookEvent {
  gateway: string;
  order_id: string;
  status: 'success' | 'failed';
  payload: Record<string, unknown>;
}
