import type { AuthTokenSet } from './types';

const STORAGE_KEY = 'rkm-auth-tokens';

function readTokens(): AuthTokenSet | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<AuthTokenSet>;
    if (!parsed.accessToken || !parsed.refreshToken) return null;

    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      expiresIn: parsed.expiresIn || 0,
    };
  } catch {
    return null;
  }
}

export function getAuthTokens(): AuthTokenSet | null {
  return readTokens();
}

export function saveAuthTokens(tokens: AuthTokenSet): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  } catch {
    // Session storage may be unavailable; the in-memory request still succeeds.
  }
}

export function clearAuthTokens(): void {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage cleanup failures during logout.
  }
}
