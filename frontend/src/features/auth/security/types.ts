export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  roleLabel: string;
  permissions: string[];
};

export type ActiveUser = Pick<AuthUser, 'id' | 'email' | 'name' | 'role' | 'roleLabel'>;

export type AuthTokenSet = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type AuthTokenResponse = AuthTokenSet & {
  user: AuthUser;
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

  login: (email: string, password: string) => Promise<void>;

  logout: () => Promise<void>;
};
