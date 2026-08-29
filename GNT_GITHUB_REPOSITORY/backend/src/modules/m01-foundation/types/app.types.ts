export interface AppConfig {
  appName: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  features: Record<string, boolean>;
  maintenanceMode: boolean;
  companyName?: string;
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
    favicon?: string;
  };
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: boolean;
    cache: boolean;
    storage: boolean;
  };
}

export interface SystemInfo {
  platform: string;
  nodeVersion: string;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  cpuLoad: number;
  activeConnections: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta: {
    requestId: string;
    timestamp: string;
  };
}
