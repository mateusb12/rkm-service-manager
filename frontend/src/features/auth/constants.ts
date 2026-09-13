import type { DevCredential } from './types';

export const AUTH_API_BASE_PATH = '/api';

export const AUTH_REFRESH_INTERVAL_MS = 10 * 60 * 1000;

export const BACKEND_HEALTH_CHECK_INTERVAL_MS = 5 * 1000;

export const LOGIN_THEME_STORAGE_KEY = 'rkm-login-theme';

export const DEFAULT_DEV_CREDENTIALS: DevCredential[] = [
    {
        email: 'admin@rkm.com.br',
        password: 'Rkm@123456',
        role: 'admin',
        label: 'Admin',
    },
    {
        email: 'operador@rkm.com.br',
        password: 'Rkm@123456',
        role: 'operator',
        label: 'Operador / Técnico',
    },
    {
        email: 'supervisor@rkm.com.br',
        password: 'Rkm@123456',
        role: 'supervisor',
        label: 'Supervisor',
    },
    {
        email: 'qualidade@rkm.com.br',
        password: 'Rkm@123456',
        role: 'quality',
        label: 'Qualidade',
    },
    {
        email: 'pcp@rkm.com.br',
        password: 'Rkm@123456',
        role: 'pcp',
        label: 'PCP',
    },
];

export const BUILD_COMMIT =
    import.meta.env.VITE_COMMIT_SHA || 'local';

export const BUILD_COMMIT_DATE =
    import.meta.env.VITE_COMMIT_DATE || 'unknown';

export const BUILD_COMMIT_TITLE =
    import.meta.env.VITE_COMMIT_TITLE || 'unknown';