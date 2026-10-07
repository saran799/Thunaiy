import { env } from '../config/env';
import { ApiError, type ApiErrorCode } from './errors';

/**
 * Thin fetch wrapper for the HTTP backend. It is only used when
 * VITE_AUTH_MODE=api and VITE_API_BASE_URL is set; otherwise the application
 * runs on the in-browser development backend (see src/services/mock).
 */

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string;
  signal?: AbortSignal;
}

const STATUS_CODES: Record<number, ApiErrorCode> = {
  400: 'validation',
  401: 'unauthorized',
  403: 'forbidden',
  404: 'not_found',
  409: 'conflict',
  422: 'validation',
  423: 'otp_attempts_exceeded',
  429: 'cooldown',
  503: 'unavailable',
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (env.apiBaseUrl.length === 0) {
    throw new ApiError('configuration', 'VITE_API_BASE_URL is not configured.');
  }

  let response: Response;
  try {
    response = await fetch(`${env.apiBaseUrl}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
      credentials: 'omit',
    });
  } catch {
    throw new ApiError('network', 'Could not reach the Thunaiy service.');
  }

  const isJson = response.headers.get('content-type')?.includes('application/json') ?? false;
  const payload: unknown = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const body = (payload ?? {}) as {
      code?: ApiErrorCode;
      message?: string;
      attemptsRemaining?: number;
      retryAfterSeconds?: number;
    };
    throw new ApiError(body.code ?? STATUS_CODES[response.status] ?? 'server', body.message ?? 'Request failed.', {
      status: response.status,
      attemptsRemaining: body.attemptsRemaining,
      retryAfterSeconds: body.retryAfterSeconds,
    });
  }

  return payload as T;
}
