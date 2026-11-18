import type { z } from 'zod';

import { apiErrorSchema } from '@bareeq/shared';
import type { ErrorCode } from '@bareeq/shared';

import { env } from './env';

export type ApiErrorCode = ErrorCode | 'NETWORK';

/** Typed error for every failed API call. `details` maps field paths to i18n message keys. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
    message: string,
    readonly details?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError;

/* The auth store registers these at startup (avoids an import cycle with the store). */
let getToken: () => string | undefined = () => undefined;
let onUnauthorized: () => void = () => undefined;

export function configureApiAuth(options: {
  getToken: () => string | undefined;
  onUnauthorized: () => void;
}): void {
  getToken = options.getToken;
  onUnauthorized = options.onUnauthorized;
}

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

export function buildUrl(path: string, query?: QueryParams): string {
  const url = new URL(`${env.apiUrl}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

/** Turns an API-relative asset path (e.g. an org's `logoUrl`) into an absolute URL. */
export function apiAssetUrl(path: string): string;
export function apiAssetUrl(path: string | null | undefined): string | null;
export function apiAssetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return /^https?:\/\//.test(path) ? path : `${env.apiUrl}${path}`;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  query?: QueryParams;
  /** JSON body, or FormData for uploads. */
  body?: unknown;
  signal?: AbortSignal;
}

async function request(path: string, options: RequestOptions): Promise<Response> {
  const headers = new Headers({ Accept: 'application/json' });
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let body: BodyInit | undefined;
  if (options.body instanceof FormData) {
    body = options.body;
  } else if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(options.body);
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, options.query), {
      method: options.method ?? 'GET',
      headers,
      body,
      signal: options.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ApiError(0, 'NETWORK', 'Network error');
  }

  if (!res.ok) {
    const payload: unknown = await res.json().catch(() => undefined);
    const parsed = apiErrorSchema.safeParse(payload);
    const error = parsed.success
      ? new ApiError(
          res.status,
          parsed.data.error.code,
          parsed.data.error.message,
          parsed.data.error.details,
        )
      : new ApiError(
          res.status,
          res.status >= 500 ? 'INTERNAL' : 'VALIDATION_ERROR',
          res.statusText,
        );
    if (res.status === 401) onUnauthorized();
    throw error;
  }
  return res;
}

/**
 * Calls the Bareeq API: attaches the session token, validates the response with `schema`,
 * and throws `ApiError` on failure. A 401 signs the user out (the router then shows /login).
 */
export async function apiFetch<S extends z.ZodType>(
  path: string,
  options: RequestOptions & { schema: S },
): Promise<z.output<S>>;
export async function apiFetch(path: string, options?: RequestOptions): Promise<void>;
export async function apiFetch(
  path: string,
  options: RequestOptions & { schema?: z.ZodType } = {},
): Promise<unknown> {
  const res = await request(path, options);
  if (!options.schema) return undefined;
  const json: unknown = await res.json();
  return options.schema.parse(json);
}

function filenameFrom(res: Response, fallback: string): string {
  const header = res.headers.get('Content-Disposition') ?? '';
  return /filename="?([^";]+)"?/.exec(header)?.[1] ?? fallback;
}

/** Downloads a file endpoint (CSV / ZIP) with the session token and saves it in the browser. */
export async function apiDownload(path: string, query?: QueryParams): Promise<void> {
  const res = await request(path, { query });
  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = filenameFrom(res, path.split('/').pop() ?? 'download');
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(href), 0);
}
