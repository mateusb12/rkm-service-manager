import { apiRequest, csrfHeaders } from '../../../shared/api/http';

import type { AuthUser, DevCredential } from './types';

export async function login(email: string, password: string): Promise<AuthUser> {
  const response = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);

    throw new Error(payload?.error || 'invalid_credentials');
  }

  return response.json();
}

export async function logout(): Promise<void> {
  await apiRequest('/auth/logout', {
    method: 'POST',
    headers: csrfHeaders(),
  });
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const response = await apiRequest('/auth/me');

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export async function refreshSession(): Promise<AuthUser> {
  const response = await apiRequest('/auth/refresh', {
    method: 'POST',
    headers: csrfHeaders(),
  });

  if (!response.ok) {
    throw new Error('session_expired');
  }

  return response.json();
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
