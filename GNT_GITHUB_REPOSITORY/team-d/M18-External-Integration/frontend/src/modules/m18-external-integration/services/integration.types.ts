/**
 * M18 — Frontend Integration Types
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

export interface IntegrationConfig {
  id: string;
  company_id: string;
  provider: string;
  type: GatewayType;
  config_json: Record<string, unknown>;
  status: GatewayStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateIntegrationConfigDto {
  company_id: string;
  provider: string;
  type: GatewayType;
  config_json: Record<string, unknown>;
  is_active?: boolean;
}

export interface UpdateIntegrationConfigDto {
  provider?: string;
  config_json?: Record<string, unknown>;
  status?: GatewayStatus;
  is_active?: boolean;
}

export interface ApiKeyResponse {
  id: string;
  name: string;
  permissions: string[];
  expires_at: string | null;
  created_at: string;
  plain_key?: string;
}

export interface GatewayStatusDto {
  type: GatewayType;
  provider: string;
  status: GatewayStatus;
  last_checked: string;
  latency_ms: number;
  message?: string;
}

export interface GatewayTestResult {
  success: boolean;
  latency_ms: number;
  message: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
  };
}
