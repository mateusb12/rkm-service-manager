const API_BASE_PATH = '/api';

const API_REQUEST_TIMEOUT_MS = 10_000;

const getAccessToken = (): string => {
  try {
    const raw = window.sessionStorage.getItem('rkm-auth-tokens');
    if (!raw) return '';

    return JSON.parse(raw)?.accessToken || '';
  } catch {
    return '';
  }
};

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
    credentials: 'omit',
    headers,
  });
}
