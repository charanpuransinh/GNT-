/**
 * GNT — साझा API client (ROUGH SCAFFOLDING — समीक्षक AI ने दिया, 2026-09-02)
 *
 * क्यों बदला: पुराना `apiClient` एक bare GET function था, पर पूरे frontend में 130 जगह
 * इसे object की तरह (.get/.post/.put/.patch/.delete) बुलाया जाता है और services
 * `r.data` पढ़ती हैं। इसलिए यह axios जैसा आकार देता है — call sites वैसे ही चलेंगे।
 *
 * ROUGH है — बाक़ी काम (retry, refresh-token, error normalization, cancel) बाद के task में।
 */

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const BASE_URL = '/api/v1';

/** RequestInit + query params — services `{ params }` bhejti hain (axios wali aadat). */
export type RequestOptions = RequestInit & { params?: object };

function withQuery(url: string, params?: object): string {
  if (!params) return url;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
    if (value === undefined || value === null || value === '') continue;
    qs.append(key, String(value));
  }
  const query = qs.toString();
  if (!query) return url;
  return url + (url.includes('?') ? '&' : '?') + query;
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  try {
    const token = localStorage.getItem('auth_token');
    const tenantId = localStorage.getItem('tenant_id');
    if (token) headers.Authorization = `Bearer ${token}`;
    if (tenantId) headers['X-Tenant-ID'] = tenantId;
  } catch {
    // localStorage उपलब्ध न हो (SSR/private mode) — बिना header आगे बढ़ो
  }
  return headers;
}

function joinUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return path.startsWith('/api/') ? path : `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

async function request<T>(method: string, path: string, body?: unknown, init: RequestOptions = {}): Promise<ApiResponse<T>> {
  const { params, ...rest } = init;
  const res = await fetch(withQuery(joinUrl(path), params), {
    ...rest,
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...((rest.headers as Record<string, string>) ?? {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  const text = await res.text();
  let parsed: unknown = undefined;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, `API ${method} ${path} failed with ${res.status}`, parsed);
  }
  return { data: parsed as T, status: res.status };
}

export const apiClient = {
  get: <T = unknown>(path: string, init?: RequestOptions) => request<T>('GET', path, undefined, init),
  post: <T = unknown>(path: string, body?: unknown, init?: RequestOptions) => request<T>('POST', path, body, init),
  put: <T = unknown>(path: string, body?: unknown, init?: RequestOptions) => request<T>('PUT', path, body, init),
  patch: <T = unknown>(path: string, body?: unknown, init?: RequestOptions) => request<T>('PATCH', path, body, init),
  delete: <T = unknown>(path: string, init?: RequestOptions) => request<T>('DELETE', path, undefined, init),
};

export default apiClient;
