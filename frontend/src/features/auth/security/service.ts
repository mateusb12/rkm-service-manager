import { apiRequest } from '../../../shared/api/http';
import { clearAuthTokens, getAuthTokens, saveAuthTokens } from './token-store';

import type { AuthTokenResponse, AuthUser, DevCredential } from './types';

export async function login(email: string, password: string): Promise<AuthUser> {
  const response = await apiRequest('/auth/login', {
    method: 'POST',
    headers: { 'X-Auth-Transport': 'bearer' },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);

    throw new Error(payload?.error || 'invalid_credentials');
  }

  const payload = (await response.json()) as AuthTokenResponse;
  saveAuthTokens(payload);
  return payload.user;
}

export async function logout(): Promise<void> {
  try {
    await apiRequest('/auth/logout', {
      method: 'POST',
    });
  } finally {
    clearAuthTokens();
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
  const tokens = getAuthTokens();
  if (!tokens) {
    clearAuthTokens();
    throw new Error('session_expired');
  }

  const response = await apiRequest('/auth/refresh', {
    method: 'POST',
    headers: { 'X-Refresh-Token': tokens.refreshToken },
  });

  if (!response.ok) {
    throw new Error('session_expired');
  }

  const payload = (await response.json()) as AuthTokenResponse;
  saveAuthTokens(payload);
  return payload.user || (payload as unknown as AuthUser);
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
