export interface GntFrontendResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    correlationId?: string;
  };
}

export async function gntRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<GntFrontendResponse<T>> {
  const response = await fetch(`/api/v1${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      success: false,
      error: {
        code: body?.error?.code ?? `HTTP_${response.status}`,
        message: body?.error?.message ?? 'Request failed',
      },
      meta: body?.meta,
    };
  }

  return body;
}
