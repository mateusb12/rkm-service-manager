import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';

import {
    AUTH_REFRESH_INTERVAL_MS,
    BACKEND_HEALTH_CHECK_INTERVAL_MS,
    DEFAULT_DEV_CREDENTIALS,
} from './constants';

import {
    checkBackendHealth,
    getCurrentUser,
    getDevCredentials,
    login as loginService,
    logout as logoutService,
    refreshSession,
} from './service';

import type {
    AuthContextValue,
    AuthUser,
    DevCredential,
} from './types';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
                                 children,
                             }: {
    children: ReactNode;
}) {
    const [user, setUser] = useState<AuthUser | null>(null);

    const [loading, setLoading] = useState(true);

    const [backendOnline, setBackendOnline] = useState(false);

    const [devCredentials, setDevCredentials] =
        useState<DevCredential[]>(DEFAULT_DEV_CREDENTIALS);

    const refresh = async () => {
        const refreshedUser = await refreshSession();

        setUser(refreshedUser);
    };

    useEffect(() => {
        Promise.all([
            getCurrentUser()
                .then(async currentUser => {
                    if (currentUser) {
                        setUser(currentUser);
                        return;
                    }

                    await refresh().catch(() => undefined);
                }),

            getDevCredentials()
                .then(setDevCredentials)
                .catch(() => undefined),
        ]).finally(() => setLoading(false));

        const timer = window.setInterval(() => {
            if (user) {
                refresh().catch(() => setUser(null));
            }
        }, AUTH_REFRESH_INTERVAL_MS);

        return () => window.clearInterval(timer);
    }, [user]);

    useEffect(() => {
        const checkBackend = async () => {
            const online = await checkBackendHealth();

            setBackendOnline(online);
        };

        checkBackend();

        const timer = window.setInterval(
            checkBackend,
            BACKEND_HEALTH_CHECK_INTERVAL_MS,
        );

        return () => window.clearInterval(timer);
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            loading,
            backendOnline,
            devCredentials,

            login: async (email, password) => {
                const authenticatedUser = await loginService(
                    email,
                    password,
                );

                setUser(authenticatedUser);
            },

            logout: async () => {
                await logoutService();

                setUser(null);
            },
        }),
        [
            backendOnline,
            devCredentials,
            loading,
            user,
        ],
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            'useAuth must be used inside AuthProvider',
        );
    }

    return context;
}