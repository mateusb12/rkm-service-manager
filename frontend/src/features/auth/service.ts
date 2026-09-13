import { AUTH_API_BASE_PATH } from './constants';

import type {
    AuthUser,
    DevCredential,
} from './types';

const getCsrfToken = (): string =>
    document.cookie
        .split('; ')
        .find(value => value.startsWith('rkm_csrf='))
        ?.split('=')[1] || '';

const request = (
    path: string,
    options: RequestInit = {},
): Promise<Response> =>
    fetch(`${AUTH_API_BASE_PATH}${path}`, {
        credentials: 'include',
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
    });

const csrfHeaders = (): HeadersInit => ({
    'X-CSRF-Token': getCsrfToken(),
});

export async function login(
    email: string,
    password: string,
): Promise<AuthUser> {
    const response = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
            email,
            password,
        }),
    });

    if (!response.ok) {
        const payload = await response
            .json()
            .catch(() => null);

        throw new Error(
            payload?.error || 'invalid_credentials',
        );
    }

    return response.json();
}

export async function logout(): Promise<void> {
    await request('/auth/logout', {
        method: 'POST',
        headers: csrfHeaders(),
    });
}

export async function getCurrentUser(): Promise<AuthUser | null> {
    const response = await request('/auth/me');

    if (!response.ok) {
        return null;
    }

    return response.json();
}

export async function refreshSession(): Promise<AuthUser> {
    const response = await request('/auth/refresh', {
        method: 'POST',
        headers: csrfHeaders(),
    });

    if (!response.ok) {
        throw new Error('session_expired');
    }

    return response.json();
}

export async function getDevCredentials(): Promise<DevCredential[]> {
    const response = await request('/auth/dev-credentials');

    if (!response.ok) {
        throw new Error('dev_credentials_unavailable');
    }

    return response.json();
}

export async function checkBackendHealth(): Promise<boolean> {
    try {
        const response = await request('/health');

        return response.ok;
    } catch {
        return false;
    }
}