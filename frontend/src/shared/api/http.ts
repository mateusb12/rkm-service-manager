const API_BASE_PATH = '/api';

const CSRF_COOKIE_NAME = 'rkm_csrf';

const CSRF_HEADER_NAME = 'X-CSRF-Token';

const API_REQUEST_TIMEOUT_MS = 10_000;

const ACCESS_TOKEN_STORAGE_KEY = 'rkm_access_token';

export const getAccessToken = (): string => sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY) || '';

export const setAccessToken = (token: string): void => {
  sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
};

export const clearAccessToken = (): void => {
  sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
};

const getCsrfToken = (): string =>
  document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(`${CSRF_COOKIE_NAME}=`))
    ?.split('=')[1] || '';

export const csrfHeaders = (): HeadersInit => ({
  [CSRF_HEADER_NAME]: getCsrfToken(),
});

export function apiRequest(path: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);

  const apiRequestTimeoutSignal = AbortSignal.timeout(API_REQUEST_TIMEOUT_MS);
  const requestAbortSignal = options.signal
    ? AbortSignal.any([options.signal, apiRequestTimeoutSignal])
    : apiRequestTimeoutSignal;

  if (typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const accessToken = getAccessToken();

  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  return fetch(`${API_BASE_PATH}${path}`, {
    ...options,
    signal: requestAbortSignal,
    credentials: 'include',
    headers,
  });
}
