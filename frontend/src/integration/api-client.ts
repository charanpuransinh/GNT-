export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
  meta?: { correlationId?: string };
}

export async function gntApi<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const response = await fetch(`/api/v1${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      success: false,
      error: {
        code: body?.error?.code || `HTTP_${response.status}`,
        message: body?.error?.message || 'Request failed',
      },
      meta: body?.meta,
    };
  }

  return body;
}
