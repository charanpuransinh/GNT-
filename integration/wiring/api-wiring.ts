export const API_WIRING_BASE = '/api/v1';

export const API_MODULES = {
  M23: `${API_WIRING_BASE}/security`,
  M24: `${API_WIRING_BASE}/performance`,
  M25: `${API_WIRING_BASE}/notifications`,
  M26: `${API_WIRING_BASE}/search`,
  M27: `${API_WIRING_BASE}/analytics`,
  M28: `${API_WIRING_BASE}/reports`,
  M29: `${API_WIRING_BASE}/mobile`,
  M30: `${API_WIRING_BASE}/ai`,
  M31: `${API_WIRING_BASE}/workforce`,
  M32: `${API_WIRING_BASE}/workflows`,
  M33: `${API_WIRING_BASE}/connectors`,
  M34: `${API_WIRING_BASE}/subscriptions`,
} as const;
