export type AuthUser = {
    id: string;
    email: string;
    name: string;
    role: string;
    roleLabel: string;
    permissions: string[];
};

export type DevCredential = {
    email: string;
    password: string;
    role: string;
    label: string;
};

export type AuthContextValue = {
    user: AuthUser | null;
    loading: boolean;
    backendOnline: boolean;
    devCredentials: DevCredential[];

    login: (
        email: string,
        password: string,
    ) => Promise<void>;

    logout: () => Promise<void>;
};