import {
  apiRequest,
  clearAccessToken,
  csrfHeaders,
  setAccessToken,
} from '../../../shared/api/http';

import type { AuthUser, DevCredential } from './types';

const REFRESH_TOKEN_STORAGE_KEY = 'rkm_refresh_token';

type TokenResponse = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

const isTokenResponse = (payload: TokenResponse | AuthUser): payload is TokenResponse =>
  'accessToken' in payload && 'refreshToken' in payload && 'user' in payload;

const getRefreshToken = (): string => sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY) || '';

const setSessionTokens = (tokens: TokenResponse): void => {
  setAccessToken(tokens.accessToken);
  sessionStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, tokens.refreshToken);
};

const clearSessionTokens = (): void => {
  clearAccessToken();
  sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
};

export async function login(email: string, password: string): Promise<AuthUser> {
  const response = await apiRequest('/auth/login', {
    method: 'POST',
    headers: {
      'X-Auth-Transport': 'bearer',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);

    throw new Error(payload?.error || 'invalid_credentials');
  }

  const payload = (await response.json()) as TokenResponse | AuthUser;

  if (isTokenResponse(payload)) {
    setSessionTokens(payload);

    return payload.user;
  }

  return payload;
}

export async function logout(): Promise<void> {
  try {
    await apiRequest('/auth/logout', {
      method: 'POST',
      headers: csrfHeaders(),
    });
  } finally {
    clearSessionTokens();
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const response = await apiRequest('/auth/me');

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export async function refreshSession(): Promise<AuthUser> {
  const refreshToken = getRefreshToken();

  const headers: HeadersInit = refreshToken
    ? {
        'X-Auth-Transport': 'bearer',
        'X-Refresh-Token': refreshToken,
      }
    : csrfHeaders();

  const response = await apiRequest('/auth/refresh', {
    method: 'POST',
    headers,
  });

  if (!response.ok) {
    throw new Error('session_expired');
  }

  const payload = (await response.json()) as TokenResponse | AuthUser;

  if (isTokenResponse(payload)) {
    setSessionTokens(payload);

    return payload.user;
  }

  return payload;
}

export async function getDevCredentials(): Promise<DevCredential[]> {
  const response = await apiRequest('/auth/dev-credentials');

  if (!response.ok) {
    throw new Error('dev_credentials_unavailable');
  }

  return response.json();
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await apiRequest('/health');

    return response.ok;
  } catch {
    return false;
  }
}
