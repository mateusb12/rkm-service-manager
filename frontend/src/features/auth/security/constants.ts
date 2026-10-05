export const AUTH_REFRESH_INTERVAL_MS = 10 * 60 * 1000;

export const BACKEND_HEALTH_CHECK_INTERVAL_MS = 5 * 1000;

export const LOGIN_THEME_STORAGE_KEY = 'rkm-login-theme';

export const BUILD_COMMIT = import.meta.env.VITE_COMMIT_SHA || 'local';

export const BUILD_COMMIT_DATE = import.meta.env.VITE_COMMIT_DATE || 'unknown';

export const BUILD_COMMIT_TITLE = import.meta.env.VITE_COMMIT_TITLE || 'unknown';
